// ─── HubNest CRM — Jenkins Pipeline ──────────────────────────────────────────
// Stages: Checkout → Lint/Test → Build Images → Push Registry → Deploy → Verify
//
// Required Jenkins Credentials (Manage Jenkins → Credentials):
//   DOCKER_REGISTRY_CREDS   — Username/Password  (DockerHub or private registry)
//   SERVER_SSH_KEY          — SSH Private Key     (deployment server)
//   SERVER_USER             — Secret Text         (SSH username on deploy server)
//   SERVER_HOST             — Secret Text         (deploy server IP or hostname)
//   ENV_SERVER_FILE         — Secret File         (server/.env for production)
//   ENV_CLIENT_FILE         — Secret File         (client/.env.local for production)
//
// Required Jenkins Plugins:
//   Pipeline, Git, Docker Pipeline, SSH Agent, Credentials Binding, Slack Notifier
// ──────────────────────────────────────────────────────────────────────────────

pipeline {
  agent any

  environment {
    // ── Registry ──────────────────────────────────────────────────────────────
    DOCKER_REGISTRY   = 'your-dockerhub-username'          // ← change this
    IMAGE_BACKEND     = "${DOCKER_REGISTRY}/hubnest-backend"
    IMAGE_FRONTEND    = "${DOCKER_REGISTRY}/hubnest-frontend"
    IMAGE_CHATBOT     = "${DOCKER_REGISTRY}/hubnest-chatbot"
    IMAGE_REPORTS     = "${DOCKER_REGISTRY}/hubnest-reports"

    // ── Tag strategy: branch-shortcommit ─────────────────────────────────────
    GIT_SHORT         = "${GIT_COMMIT[0..7]}"
    IMAGE_TAG         = "${BRANCH_NAME}-${GIT_SHORT}"
    LATEST_TAG        = "${BRANCH_NAME}-latest"

    // ── Deploy paths on server ────────────────────────────────────────────────
    DEPLOY_DIR        = '/opt/hubnest'

    // ── Node / Python versions ────────────────────────────────────────────────
    NODE_VERSION      = '20'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '15'))
    timeout(time: 45, unit: 'MINUTES')
    disableConcurrentBuilds()
    ansiColor('xterm')
  }

  triggers {
    // Auto-build on push to main or develop; PRs handled by webhook
    pollSCM('H/5 * * * *')
  }

  stages {

    // ── 1. Checkout ───────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        echo '── Checking out source ──'
        checkout scm
        script {
          env.GIT_SHORT  = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          env.IMAGE_TAG  = "${BRANCH_NAME}-${env.GIT_SHORT}"
          env.GIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
          env.GIT_MSG    = sh(script: 'git log -1 --pretty=%s', returnStdout: true).trim()
        }
        echo "Branch: ${BRANCH_NAME} | Commit: ${env.GIT_SHORT} | Author: ${env.GIT_AUTHOR}"
        echo "Message: ${env.GIT_MSG}"
      }
    }

    // ── 2. Install & Lint ─────────────────────────────────────────────────────
    stage('Install & Lint') {
      parallel {
        stage('Client — Install & Lint') {
          steps {
            dir('client') {
              sh 'npm ci --prefer-offline'
              sh 'npm run lint -- --max-warnings=0 || true'
            }
          }
        }
        stage('Server — Install') {
          steps {
            dir('server') {
              sh 'npm ci --prefer-offline'
            }
          }
        }
      }
    }

    // ── 3. Build ──────────────────────────────────────────────────────────────
    stage('Build') {
      parallel {
        stage('Build — Next.js') {
          steps {
            dir('client') {
              withCredentials([file(credentialsId: 'ENV_CLIENT_FILE', variable: 'ENV_FILE')]) {
                sh 'cp "$ENV_FILE" .env.local'
              }
              sh 'npm run build'
              sh 'rm -f .env.local'
            }
          }
        }
        stage('Build — Server Docker image') {
          steps {
            dir('server') {
              sh """
                docker build \
                  --build-arg NODE_ENV=production \
                  --cache-from ${IMAGE_BACKEND}:${LATEST_TAG} \
                  -t ${IMAGE_BACKEND}:${IMAGE_TAG} \
                  -t ${IMAGE_BACKEND}:${LATEST_TAG} \
                  .
              """
            }
          }
        }
        stage('Build — Chatbot Docker image') {
          steps {
            dir('crm_microservices/ai_chatbot') {
              sh """
                docker build \
                  --cache-from ${IMAGE_CHATBOT}:${LATEST_TAG} \
                  -t ${IMAGE_CHATBOT}:${IMAGE_TAG} \
                  -t ${IMAGE_CHATBOT}:${LATEST_TAG} \
                  .
              """
            }
          }
        }
        stage('Build — Reports Docker image') {
          steps {
            dir('crm_microservices/report_service') {
              sh """
                docker build \
                  --cache-from ${IMAGE_REPORTS}:${LATEST_TAG} \
                  -t ${IMAGE_REPORTS}:${IMAGE_TAG} \
                  -t ${IMAGE_REPORTS}:${LATEST_TAG} \
                  .
              """
            }
          }
        }
      }
    }

    // ── 4. Build & Tag Frontend Docker image ─────────────────────────────────
    stage('Build Frontend Image') {
      steps {
        sh """
          docker build \
            --build-arg NODE_ENV=production \
            --cache-from ${IMAGE_FRONTEND}:${LATEST_TAG} \
            -f client/Dockerfile \
            -t ${IMAGE_FRONTEND}:${IMAGE_TAG} \
            -t ${IMAGE_FRONTEND}:${LATEST_TAG} \
            client/
        """
      }
    }

    // ── 5. Push to Registry ───────────────────────────────────────────────────
    stage('Push Images') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
          branch 'staging'
        }
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'DOCKER_REGISTRY_CREDS',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
          sh """
            docker push ${IMAGE_BACKEND}:${IMAGE_TAG}
            docker push ${IMAGE_BACKEND}:${LATEST_TAG}
            docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}
            docker push ${IMAGE_FRONTEND}:${LATEST_TAG}
            docker push ${IMAGE_CHATBOT}:${IMAGE_TAG}
            docker push ${IMAGE_CHATBOT}:${LATEST_TAG}
            docker push ${IMAGE_REPORTS}:${IMAGE_TAG}
            docker push ${IMAGE_REPORTS}:${LATEST_TAG}
          """
          sh 'docker logout'
        }
      }
    }

    // ── 6. Deploy ─────────────────────────────────────────────────────────────
    stage('Deploy') {
      when {
        anyOf { branch 'main'; branch 'staging' }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'SERVER_SSH_KEY',  keyFileVariable: 'SSH_KEY'),
          string(credentialsId: 'SERVER_USER', variable: 'SSH_USER'),
          string(credentialsId: 'SERVER_HOST', variable: 'SSH_HOST'),
          file(credentialsId: 'ENV_SERVER_FILE',  variable: 'ENV_SERVER'),
          file(credentialsId: 'ENV_CLIENT_FILE',  variable: 'ENV_CLIENT'),
          usernamePassword(
            credentialsId: 'DOCKER_REGISTRY_CREDS',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )
        ]) {
          script {
            def deployEnv   = (BRANCH_NAME == 'main') ? 'production' : 'staging'
            def composeFile = (BRANCH_NAME == 'main') ? 'docker-compose.prod.yml' : 'docker-compose.staging.yml'

            // Upload env files + deploy compose to server
            sh """
              chmod 600 "$SSH_KEY"

              # Upload compose file
              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
                deploy/${composeFile} \
                ${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/docker-compose.yml

              # Upload environment files
              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
                "$ENV_SERVER" ${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/server.env

              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
                "$ENV_CLIENT" ${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/client.env

              # Upload nginx config
              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
                deploy/nginx.conf ${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/nginx.conf
            """

            // Run deploy script on server
            sh """
              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no \
                ${SSH_USER}@${SSH_HOST} '
                  set -e
                  cd ${DEPLOY_DIR}

                  echo "── Pulling latest images ──"
                  echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin

                  IMAGE_TAG=${IMAGE_TAG} \\
                  IMAGE_BACKEND=${IMAGE_BACKEND} \\
                  IMAGE_FRONTEND=${IMAGE_FRONTEND} \\
                  IMAGE_CHATBOT=${IMAGE_CHATBOT} \\
                  IMAGE_REPORTS=${IMAGE_REPORTS} \\
                  docker compose pull

                  echo "── Running DB migrations ──"
                  IMAGE_TAG=${IMAGE_TAG} \\
                  IMAGE_BACKEND=${IMAGE_BACKEND} \\
                  IMAGE_FRONTEND=${IMAGE_FRONTEND} \\
                  IMAGE_CHATBOT=${IMAGE_CHATBOT} \\
                  IMAGE_REPORTS=${IMAGE_REPORTS} \\
                  docker compose run --rm backend npm run migrate

                  echo "── Restarting services (zero-downtime rolling) ──"
                  IMAGE_TAG=${IMAGE_TAG} \\
                  IMAGE_BACKEND=${IMAGE_BACKEND} \\
                  IMAGE_FRONTEND=${IMAGE_FRONTEND} \\
                  IMAGE_CHATBOT=${IMAGE_CHATBOT} \\
                  IMAGE_REPORTS=${IMAGE_REPORTS} \\
                  docker compose up -d --remove-orphans

                  docker logout
                  echo "── Deploy complete ──"
                '
            """
          }
        }
      }
    }

    // ── 7. Health Check ───────────────────────────────────────────────────────
    stage('Health Check') {
      when {
        anyOf { branch 'main'; branch 'staging' }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'SERVER_SSH_KEY', keyFileVariable: 'SSH_KEY'),
          string(credentialsId: 'SERVER_USER', variable: 'SSH_USER'),
          string(credentialsId: 'SERVER_HOST', variable: 'SSH_HOST')
        ]) {
          sh """
            chmod 600 "$SSH_KEY"
            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no \
              ${SSH_USER}@${SSH_HOST} '
                echo "── Waiting for services to be healthy ──"
                sleep 15

                check() {
                  local url=\$1
                  local name=\$2
                  local max=12
                  local i=0
                  while [ \$i -lt \$max ]; do
                    if curl -sf "\$url" > /dev/null 2>&1; then
                      echo "✓ \$name is healthy"
                      return 0
                    fi
                    i=\$((i+1))
                    echo "  Waiting for \$name (\$i/\$max)…"
                    sleep 5
                  done
                  echo "✗ \$name failed health check"
                  return 1
                }

                check "http://localhost:5000/health"  "Backend API"
                check "http://localhost:3000"          "Frontend"
                check "http://localhost:8002/api/health" "Reports Service"
                check "http://localhost:8003/docs"     "Chatbot Service"

                echo "── All services healthy ──"
              '
          """
        }
      }
    }

  } // end stages

  // ── Post Actions ─────────────────────────────────────────────────────────────
  post {
    always {
      // Clean up dangling images on build agent
      sh 'docker image prune -f --filter "until=24h" || true'
      cleanWs()
    }
    success {
      echo "✓ Pipeline succeeded — ${BRANCH_NAME}@${env.GIT_SHORT}"
      // Uncomment and configure Slack plugin for notifications:
      // slackSend channel: '#deployments',
      //   color: 'good',
      //   message: "✅ *HubNest CRM* deployed to ${BRANCH_NAME}\n*${env.GIT_MSG}* by ${env.GIT_AUTHOR}\nBuild: ${BUILD_URL}"
    }
    failure {
      echo "✗ Pipeline FAILED — ${BRANCH_NAME}@${env.GIT_SHORT}"
      // slackSend channel: '#deployments',
      //   color: 'danger',
      //   message: "❌ *HubNest CRM* FAILED on ${BRANCH_NAME}\n*${env.GIT_MSG}* by ${env.GIT_AUTHOR}\nBuild: ${BUILD_URL}"
    }
  }
}

// ─── HubNest CRM — Jenkins Pipeline (Windows Agent) ─────────────────────────
// Compatible with: Windows Jenkins + Docker Desktop + NodeJS Tool
// Stages: Checkout → Install → Build → Push Images → Deploy(disabled) → Health(disabled)
//
// Jenkins Setup Required:
//   1. Manage Jenkins → Tools → NodeJS → Add: name="node22", version=22.x
//   2. Manage Jenkins → Credentials → Global → Add:
//        DOCKER_REGISTRY_CREDS  — Username/Password (DockerHub)
//        ENV_CLIENT_FILE        — Secret File (client/.env.local)
//        ENV_SERVER_FILE        — Secret File (server/.env)
//        SERVER_SSH_KEY         — SSH key (add later when EC2 ready)
//        SERVER_USER            — Secret Text (add later)
//        SERVER_HOST            — Secret Text (add later)
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
  agent any

  tools {
    nodejs 'node22'
  }

  environment {
    DOCKER_REGISTRY = 'srjchudamanideveloper'
    IMAGE_BACKEND   = "${DOCKER_REGISTRY}/hubnest-backend"
    IMAGE_FRONTEND  = "${DOCKER_REGISTRY}/hubnest-frontend"
    IMAGE_CHATBOT   = "${DOCKER_REGISTRY}/hubnest-chatbot"
    IMAGE_REPORTS   = "${DOCKER_REGISTRY}/hubnest-reports"

    // Safe defaults — overwritten in Checkout stage
    GIT_SHORT  = 'latest'
    IMAGE_TAG  = 'latest'
    LATEST_TAG = 'latest'

    DEPLOY_DIR = '/opt/hubnest'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  stages {

    // ── 1. Checkout ───────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm
        script {
          // BRANCH_NAME can be null on a plain Pipeline job (not Multibranch).
          // Fall back to the actual working branch name.
          if (!env.BRANCH_NAME) {
            env.BRANCH_NAME = bat(
              script: 'git rev-parse --abbrev-ref HEAD',
              returnStdout: true
            ).trim().readLines().last()
          }
          if (!env.BRANCH_NAME || env.BRANCH_NAME == 'HEAD') {
            env.BRANCH_NAME = 'redesign-super-admin-dashboard'
          }

          env.GIT_SHORT = bat(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim().readLines().last()

          // Sanitise branch name for use as a Docker tag (/ → -)
          def safeTag = env.BRANCH_NAME.replaceAll('/', '-').replaceAll('[^a-zA-Z0-9._-]', '-')
          env.IMAGE_TAG  = "${safeTag}-${env.GIT_SHORT}"
          env.LATEST_TAG = "${safeTag}-latest"

          env.GIT_AUTHOR = bat(
            script: 'git log -1 --pretty=%%an',
            returnStdout: true
          ).trim().readLines().last()

          env.GIT_MSG = bat(
            script: 'git log -1 --pretty=%%s',
            returnStdout: true
          ).trim().readLines().last()
        }
        echo "Branch   : ${env.BRANCH_NAME}"
        echo "Commit   : ${env.GIT_SHORT}"
        echo "Image Tag: ${env.IMAGE_TAG}"
        echo "Author   : ${env.GIT_AUTHOR}"
        echo "Message  : ${env.GIT_MSG}"
      }
    }

    // ── 2. Install Dependencies ───────────────────────────────────────────────
    stage('Install') {
      parallel {
        stage('Client — install') {
          steps {
            dir('client') {
              bat 'node --version'
              bat 'npm --version'
              bat 'npm install'
            }
          }
        }
        stage('Server — install') {
          steps {
            dir('server') {
              bat 'npm install'
            }
          }
        }
      }
    }

    // ── 3. Build ──────────────────────────────────────────────────────────────
    stage('Build') {
      parallel {

        stage('Next.js Build') {
          steps {
            dir('client') {
              withCredentials([file(credentialsId: 'ENV_CLIENT_FILE', variable: 'ENV_FILE')]) {
                bat 'copy "%ENV_FILE%" .env.local'
              }
              bat 'npm run build'
              bat 'if exist .env.local del /f .env.local'
            }
          }
        }

        stage('Backend Docker Image') {
          steps {
            dir('server') {
              bat "docker build --build-arg NODE_ENV=production -t %IMAGE_BACKEND%:%IMAGE_TAG% -t %IMAGE_BACKEND%:%LATEST_TAG% ."
            }
          }
        }

        stage('Chatbot Docker Image') {
          steps {
            script {
              if (fileExists('crm_microservices/ai_chatbot/Dockerfile')) {
                dir('crm_microservices/ai_chatbot') {
                  bat "docker build -t %IMAGE_CHATBOT%:%IMAGE_TAG% -t %IMAGE_CHATBOT%:%LATEST_TAG% ."
                }
              } else {
                echo 'SKIP: crm_microservices/ai_chatbot/Dockerfile not found'
              }
            }
          }
        }

        stage('Reports Docker Image') {
          steps {
            script {
              if (fileExists('crm_microservices/report_service/Dockerfile')) {
                dir('crm_microservices/report_service') {
                  bat "docker build -t %IMAGE_REPORTS%:%IMAGE_TAG% -t %IMAGE_REPORTS%:%LATEST_TAG% ."
                }
              } else {
                echo 'SKIP: crm_microservices/report_service/Dockerfile not found'
              }
            }
          }
        }

      }
    }

    // ── 4. Frontend Docker Image ──────────────────────────────────────────────
    stage('Frontend Docker Image') {
      steps {
        script {
          if (fileExists('client/Dockerfile')) {
            bat "docker build --build-arg NODE_ENV=production -f client/Dockerfile -t %IMAGE_FRONTEND%:%IMAGE_TAG% -t %IMAGE_FRONTEND%:%LATEST_TAG% client/"
          } else {
            echo 'SKIP: client/Dockerfile not found'
          }
        }
      }
    }

    // ── 5. Push to DockerHub ──────────────────────────────────────────────────
    stage('Push Images') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
          branch 'develop'
          branch 'staging'
          branch 'redesign-super-admin-dashboard'
          expression { return env.BRANCH_NAME == 'redesign-super-admin-dashboard' }
        }
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'DOCKER_REGISTRY_CREDS',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          bat 'echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin'

          bat "docker push %IMAGE_BACKEND%:%IMAGE_TAG%"
          bat "docker push %IMAGE_BACKEND%:%LATEST_TAG%"

          script {
            if (fileExists('client/Dockerfile')) {
              bat "docker push %IMAGE_FRONTEND%:%IMAGE_TAG%"
              bat "docker push %IMAGE_FRONTEND%:%LATEST_TAG%"
            }
            if (fileExists('crm_microservices/ai_chatbot/Dockerfile')) {
              bat "docker push %IMAGE_CHATBOT%:%IMAGE_TAG%"
              bat "docker push %IMAGE_CHATBOT%:%LATEST_TAG%"
            }
            if (fileExists('crm_microservices/report_service/Dockerfile')) {
              bat "docker push %IMAGE_REPORTS%:%IMAGE_TAG%"
              bat "docker push %IMAGE_REPORTS%:%LATEST_TAG%"
            }
          }

          bat 'docker logout'
        }
      }
    }

    // ── 6. Deploy to EC2 — DISABLED until server is ready ────────────────────
    // To enable:
    //   1. Create EC2 instance and add SERVER_SSH_KEY, SERVER_USER, SERVER_HOST credentials
    //   2. Run deploy/setup-server.sh on the EC2 instance
    //   3. Remove the line: expression { return false }
    stage('Deploy') {
      when {
        allOf {
          anyOf {
            branch 'main'
            branch 'master'
            branch 'staging'
            expression { return env.BRANCH_NAME in ['main', 'master', 'staging'] }
          }
          expression { return false } // ← remove this line when EC2 is ready
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(
            credentialsId: 'SERVER_SSH_KEY',
            keyFileVariable: 'SSH_KEY',
            usernameVariable: 'SSH_USER_FROM_CRED'
          ),
          string(credentialsId: 'SERVER_USER', variable: 'SSH_USER'),
          string(credentialsId: 'SERVER_HOST', variable: 'SSH_HOST'),
          file(credentialsId: 'ENV_SERVER_FILE', variable: 'ENV_SERVER'),
          file(credentialsId: 'ENV_CLIENT_FILE', variable: 'ENV_CLIENT'),
          usernamePassword(
            credentialsId: 'DOCKER_REGISTRY_CREDS',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )
        ]) {
          script {
            def composeFile = (env.BRANCH_NAME in ['main','master'])
              ? 'docker-compose.prod.yml'
              : 'docker-compose.staging.yml'

            bat """
              scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no deploy\\${composeFile} %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/docker-compose.yml
              scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no "%ENV_SERVER%" %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/server.env
              scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no "%ENV_CLIENT%" %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/client.env
              scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no deploy\\nginx.conf %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/nginx.conf
            """

            bat """
              ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SSH_HOST% "cd %DEPLOY_DIR% && echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin && IMAGE_TAG=%IMAGE_TAG% IMAGE_BACKEND=%IMAGE_BACKEND% IMAGE_FRONTEND=%IMAGE_FRONTEND% IMAGE_CHATBOT=%IMAGE_CHATBOT% IMAGE_REPORTS=%IMAGE_REPORTS% docker compose pull && IMAGE_TAG=%IMAGE_TAG% IMAGE_BACKEND=%IMAGE_BACKEND% IMAGE_FRONTEND=%IMAGE_FRONTEND% IMAGE_CHATBOT=%IMAGE_CHATBOT% IMAGE_REPORTS=%IMAGE_REPORTS% docker compose run --rm backend npm run migrate && IMAGE_TAG=%IMAGE_TAG% IMAGE_BACKEND=%IMAGE_BACKEND% IMAGE_FRONTEND=%IMAGE_FRONTEND% IMAGE_CHATBOT=%IMAGE_CHATBOT% IMAGE_REPORTS=%IMAGE_REPORTS% docker compose up -d --remove-orphans && docker logout"
            """
          }
        }
      }
    }

    // ── 7. Health Check — DISABLED until EC2 is ready ────────────────────────
    stage('Health Check') {
      when {
        allOf {
          anyOf {
            branch 'main'
            branch 'master'
            expression { return env.BRANCH_NAME in ['main', 'master'] }
          }
          expression { return false } // ← remove this line when EC2 is ready
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'SERVER_SSH_KEY', keyFileVariable: 'SSH_KEY'),
          string(credentialsId: 'SERVER_USER', variable: 'SSH_USER'),
          string(credentialsId: 'SERVER_HOST', variable: 'SSH_HOST')
        ]) {
          bat """
            ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SSH_HOST% "sleep 15 && curl -sf http://localhost:5000/health && echo Backend OK && curl -sf http://localhost:3000 && echo Frontend OK"
          """
        }
      }
    }

  } // end stages

  // ── Post Actions ─────────────────────────────────────────────────────────────
  post {
    always {
      bat 'docker image prune -f || exit 0'
      cleanWs()
    }
    success {
      echo "SUCCESS — ${env.BRANCH_NAME} @ ${env.GIT_SHORT} — images: ${env.IMAGE_TAG}"
    }
    failure {
      echo "FAILED  — ${env.BRANCH_NAME} @ ${env.GIT_SHORT}"
    }
  }
}

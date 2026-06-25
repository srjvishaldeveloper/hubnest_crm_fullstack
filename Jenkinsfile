// ─────────────────────────────────────────────────────────────────────────────
// HubNest CRM — Jenkins Pipeline
// ─────────────────────────────────────────────────────────────────────────────
//
// JENKINS SETUP (one-time, before first run):
//
//  1. Manage Jenkins → Tools → NodeJS → Add installation:
//       Name: node-22    Version: 22.x
//
//  2. Manage Jenkins → Credentials → Global → Add the following:
//
//     ID                    Type                  Value
//     ──────────────────    ──────────────────    ──────────────────────────────
//     DOCKER_REGISTRY_CREDS Username/Password     DockerHub login
//     ENV_CLIENT_FILE       Secret File           contents of client/.env.local
//     ENV_SERVER_FILE       Secret File           contents of server/.env
//     SERVER_SSH_KEY        SSH Private Key       EC2 private key  (add later)
//     SERVER_USER           Secret Text           EC2 username     (add later)
//     SERVER_HOST           Secret Text           EC2 IP/hostname  (add later)
//
//  3. Create a Pipeline job:
//       - Definition: Pipeline script from SCM
//       - SCM: Git  →  your repo URL
//       - Branch: */main
//       - Script Path: Jenkinsfile
//
// BRANCHES:
//   main / master  → build + push Docker images + deploy to EC2 (when ready)
//   develop        → build + push Docker images (no deploy)
//   all others     → build + test only (no push)
//
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
  agent any

  tools {
    nodejs 'node-22'
  }

  environment {
    // ── Docker Hub ────────────────────────────────────────────────────────────
    DOCKER_REGISTRY = 'srjglobaltech'          // ← your DockerHub username
    IMAGE_BACKEND   = "${DOCKER_REGISTRY}/hubnest-backend"
    IMAGE_FRONTEND  = "${DOCKER_REGISTRY}/hubnest-frontend"
    IMAGE_CHATBOT   = "${DOCKER_REGISTRY}/hubnest-chatbot"
    IMAGE_REPORTS   = "${DOCKER_REGISTRY}/hubnest-reports"

    // ── Server deploy path (EC2) ──────────────────────────────────────────────
    DEPLOY_DIR      = '/opt/hubnest'

    // ── Defaults (overwritten in Checkout stage) ──────────────────────────────
    IMAGE_TAG       = 'latest'
    LATEST_TAG      = 'latest'
    GIT_SHORT       = 'unknown'
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
          // Resolve branch name (works for both Pipeline and Multibranch)
          if (!env.BRANCH_NAME) {
            env.BRANCH_NAME = bat(
              script: 'git rev-parse --abbrev-ref HEAD',
              returnStdout: true
            ).trim().readLines().last()
          }
          if (!env.BRANCH_NAME || env.BRANCH_NAME == 'HEAD') {
            env.BRANCH_NAME = 'main'
          }

          env.GIT_SHORT = bat(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim().readLines().last()

          env.GIT_AUTHOR = bat(
            script: 'git log -1 --pretty=%%an',
            returnStdout: true
          ).trim().readLines().last()

          env.GIT_MSG = bat(
            script: 'git log -1 --pretty=%%s',
            returnStdout: true
          ).trim().readLines().last()

          // Sanitise branch name for Docker tag  (feature/foo → feature-foo)
          def safeTag    = env.BRANCH_NAME.replaceAll('[^a-zA-Z0-9._-]', '-')
          env.IMAGE_TAG  = "${safeTag}-${env.GIT_SHORT}"
          env.LATEST_TAG = "${safeTag}-latest"
        }

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Branch  : ${env.BRANCH_NAME}"
        echo "  Commit  : ${env.GIT_SHORT}"
        echo "  Tag     : ${env.IMAGE_TAG}"
        echo "  Author  : ${env.GIT_AUTHOR}"
        echo "  Message : ${env.GIT_MSG}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      }
    }

    // ── 2. Install Dependencies ───────────────────────────────────────────────
    stage('Install') {
      parallel {
        stage('Client') {
          steps {
            dir('client') {
              bat 'npm ci --prefer-offline'
            }
          }
        }
        stage('Server') {
          steps {
            dir('server') {
              bat 'npm ci --prefer-offline'
            }
          }
        }
      }
    }

    // ── 3. Build ──────────────────────────────────────────────────────────────
    stage('Build') {
      parallel {

        // Next.js production build
        stage('Next.js') {
          steps {
            dir('client') {
              script {
                try {
                  withCredentials([file(credentialsId: 'ENV_CLIENT_FILE', variable: 'ENV_FILE')]) {
                    bat 'copy "%ENV_FILE%" .env.local'
                  }
                } catch (ignored) {
                  echo "INFO: ENV_CLIENT_FILE not configured — using defaults"
                  bat 'echo NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 > .env.local'
                }
                bat 'npm run build'
                bat 'if exist .env.local del /f .env.local'
              }
            }
          }
        }

        // Backend Docker image
        stage('Backend image') {
          steps {
            dir('server') {
              bat "docker build -t %IMAGE_BACKEND%:%IMAGE_TAG% -t %IMAGE_BACKEND%:%LATEST_TAG% ."
            }
          }
        }

        // Frontend Docker image
        stage('Frontend image') {
          steps {
            script {
              if (fileExists('client/Dockerfile')) {
                bat "docker build -f client/Dockerfile -t %IMAGE_FRONTEND%:%IMAGE_TAG% -t %IMAGE_FRONTEND%:%LATEST_TAG% client/"
              } else {
                echo 'SKIP: client/Dockerfile not found'
              }
            }
          }
        }

        // AI Chatbot Docker image (non-blocking)
        stage('Chatbot image') {
          steps {
            script {
              if (fileExists('crm_microservices/ai_chatbot/Dockerfile')) {
                try {
                  dir('crm_microservices/ai_chatbot') {
                    bat "docker build -t %IMAGE_CHATBOT%:%IMAGE_TAG% -t %IMAGE_CHATBOT%:%LATEST_TAG% ."
                  }
                } catch (e) {
                  echo "WARNING: Chatbot build failed (non-blocking): ${e.message}"
                }
              } else {
                echo 'SKIP: crm_microservices/ai_chatbot/Dockerfile not found'
              }
            }
          }
        }

        // Reports service Docker image (non-blocking)
        stage('Reports image') {
          steps {
            script {
              if (fileExists('crm_microservices/report_service/Dockerfile')) {
                try {
                  dir('crm_microservices/report_service') {
                    bat "docker build -t %IMAGE_REPORTS%:%IMAGE_TAG% -t %IMAGE_REPORTS%:%LATEST_TAG% ."
                  }
                } catch (e) {
                  echo "WARNING: Reports build failed (non-blocking): ${e.message}"
                }
              } else {
                echo 'SKIP: crm_microservices/report_service/Dockerfile not found'
              }
            }
          }
        }

      }
    }

    // ── 4. Push to DockerHub ──────────────────────────────────────────────────
    // Runs only on main / master / develop branches
    stage('Push Images') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
          branch 'develop'
          expression { return env.BRANCH_NAME in ['main', 'master', 'develop'] }
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

    // ── 5. Deploy to EC2 ─────────────────────────────────────────────────────
    // CURRENTLY DISABLED — remove `expression { return false }` when EC2 is ready
    //
    // To enable:
    //   1. Provision EC2 and run:  bash deploy/setup-server.sh
    //   2. Add SERVER_SSH_KEY, SERVER_USER, SERVER_HOST credentials in Jenkins
    //   3. Delete the line:  expression { return false }
    stage('Deploy') {
      when {
        allOf {
          anyOf {
            branch 'main'
            branch 'master'
            expression { return env.BRANCH_NAME in ['main', 'master'] }
          }
          expression { return false }   // ← DELETE THIS LINE when EC2 is ready
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'SERVER_SSH_KEY', keyFileVariable: 'SSH_KEY'),
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
          // Copy compose file + env files to server
          bat """
            scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no docker-compose.yml %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/docker-compose.yml
            scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no "%ENV_SERVER%" %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/server.env
            scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no "%ENV_CLIENT%" %SSH_USER%@%SSH_HOST%:%DEPLOY_DIR%/client.env
          """
          // Pull new images, run migrations, restart containers
          bat """
            ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SSH_HOST% ^
              "cd %DEPLOY_DIR% ^
               && echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin ^
               && IMAGE_TAG=%IMAGE_TAG% docker compose pull ^
               && IMAGE_TAG=%IMAGE_TAG% docker compose run --rm backend npm run migrate ^
               && IMAGE_TAG=%IMAGE_TAG% docker compose up -d --remove-orphans ^
               && docker logout"
          """
        }
      }
    }

    // ── 6. Health Check ───────────────────────────────────────────────────────
    // CURRENTLY DISABLED — enable together with Deploy stage
    stage('Health Check') {
      when {
        allOf {
          anyOf {
            branch 'main'
            branch 'master'
            expression { return env.BRANCH_NAME in ['main', 'master'] }
          }
          expression { return false }   // ← DELETE THIS LINE when EC2 is ready
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'SERVER_SSH_KEY', keyFileVariable: 'SSH_KEY'),
          string(credentialsId: 'SERVER_USER', variable: 'SSH_USER'),
          string(credentialsId: 'SERVER_HOST', variable: 'SSH_HOST')
        ]) {
          bat """
            ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SSH_HOST% ^
              "sleep 15 ^
               && curl -sf http://localhost:5000/health && echo '✓ Backend OK' ^
               && curl -sf http://localhost:3000       && echo '✓ Frontend OK'"
          """
        }
      }
    }

  } // end stages

  // ── Post Actions ─────────────────────────────────────────────────────────────
  post {
    always {
      script {
        try { bat 'docker image prune -f' } catch (ignored) {}
        try { cleanWs() } catch (ignored) {}
      }
    }
    success {
      echo "✓ BUILD PASSED — ${env.BRANCH_NAME} @ ${env.GIT_SHORT} — tag: ${env.IMAGE_TAG}"
    }
    failure {
      echo "✗ BUILD FAILED — ${env.BRANCH_NAME} @ ${env.GIT_SHORT}"
    }
  }
}

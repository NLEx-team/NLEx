# Per-Service Deployment Guide

> [!WARNING]
> **Kubernetes Deployment Support is Deprecated**
> Production Kubernetes deployment manifests are officially deprecated and are no longer actively supported under our current product roadmap. The manifests provided below are for historical reference only. DevOps teams are advised to configure generic container orchestrators or bare-metal deployments using the environment variable guides below.

This guide explains how to deploy each NLEx service independently for bare-metal, general container orchestration, or other platforms. It is the **primary reference for DevOps teams and customers** performing production deployments.

---

## Architecture Overview

```mermaid
graph TB
    subgraph External
        U[Users / Browsers]
    end

    subgraph Cluster
        FE[Frontend<br/>Nginx + Static Build]
        BE[Backend<br/>FastAPI / Uvicorn]
        PG[(PostgreSQL)]
        TR[Trino]
    end

    U --> FE
    FE --> BE
    BE --> PG
    BE --> TR
    TR -->|queries| DS[(External Data Sources)]
```

**Four services to deploy:**

| # | Service | Image | Default Port |
|---|---|---|---|
| 1 | PostgreSQL | `postgres:15-alpine` | `5432` |
| 2 | Trino | `trinodb/trino:latest` | `8080` |
| 3 | Backend | Custom (`backend/Dockerfile`) | `8000` |
| 4 | Frontend | Custom (`frontend/Dockerfile`) | `80` |

---

## Startup Order

!!!warning "Strict startup order required"
    The backend **must** start after PostgreSQL and Trino are healthy. It will crash or retry indefinitely if either dependency is unavailable.

```
1. PostgreSQL  ──►  (wait for healthy)
2. Trino       ──►  (wait for healthy)
3. Backend     ──►  (wait for healthy)
4. Frontend    ──►  (ready)
```

In Kubernetes, use **init containers** or **readiness probes** to enforce this order. See the manifests below.

---

## Service Details

### 1. PostgreSQL

| Property | Value |
|---|---|
| **Image** | `postgres:15-alpine` |
| **Port** | `5432` |
| **Health check** | `pg_isready -U $POSTGRES_USER` |
| **Persistent storage** | `/var/lib/postgresql/data` — **PVC required** |
| **CPU / Memory** | `250m / 512Mi` (request) — `1000m / 2Gi` (limit) |

**Required environment variables:**

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |

#### Kubernetes Manifest

```yaml
# postgresql-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgresql-config
  namespace: nlex
data:
  POSTGRES_USER: "nlex"
  POSTGRES_DB: "nlex_db"
---
# postgresql-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgresql-secret
  namespace: nlex
type: Opaque
stringData:
  POSTGRES_PASSWORD: "CHANGE_ME_IN_PRODUCTION"
---
# postgresql-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-pvc
  namespace: nlex
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
# postgresql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: nlex
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
        - name: postgresql
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - configMapRef:
                name: postgresql-config
            - secretRef:
                name: postgresql-secret
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
              subPath: pgdata
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "2Gi"
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "nlex"]
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "nlex"]
            initialDelaySeconds: 30
            periodSeconds: 30
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgresql-pvc
---
# postgresql-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: nlex
spec:
  selector:
    app: postgresql
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
```

---

### 2. Trino

| Property | Value |
|---|---|
| **Image** | `trinodb/trino:latest` |
| **Port** | `8080` |
| **Health check** | `curl -f http://localhost:8080/v1/info` |
| **Persistent storage** | `/etc/trino/catalog` — shared volume with backend |
| **CPU / Memory** | `500m / 1Gi` (request) — `2000m / 4Gi` (limit) |

!!!warning "Catalogs are lost on restart"
    Trino catalog `.properties` files are generated dynamically by the backend and written to a shared volume. If Trino restarts **without this volume**, all catalog configurations are lost and must be re-registered through the NLEx API.

**Required environment variables:**

| Variable | Description |
|---|---|
| `TRINO_DISCOVERY_URI` | Usually `http://localhost:8080` (self-referencing in single-node mode) |

#### Kubernetes Manifest

```yaml
# trino-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: trino-catalog-pvc
  namespace: nlex
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
---
# trino-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trino
  namespace: nlex
spec:
  replicas: 1
  selector:
    matchLabels:
      app: trino
  template:
    metadata:
      labels:
        app: trino
    spec:
      containers:
        - name: trino
          image: trinodb/trino:latest
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: catalog
              mountPath: /etc/trino/catalog
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          readinessProbe:
            httpGet:
              path: /v1/info
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /v1/info
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 30
      volumes:
        - name: catalog
          persistentVolumeClaim:
            claimName: trino-catalog-pvc
---
# trino-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: trino
  namespace: nlex
spec:
  selector:
    app: trino
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

---

### 3. Backend (FastAPI)

| Property | Value |
|---|---|
| **Image** | Custom — build from `backend/Dockerfile` |
| **Port** | `8000` |
| **Health check** | `curl -f http://localhost:8000/health` |
| **Persistent storage** | `/app/exports` — for Excel/CSV exports |
| **CPU / Memory** | `250m / 512Mi` (request) — `1000m / 2Gi` (limit) |

**Required environment variables:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `TRINO_HOST` | Trino hostname |
| `TRINO_PORT` | Trino port (default `8080`) |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |

!!!warning "JWT_SECRET_KEY must be identical across replicas"
    If you scale the backend to multiple replicas, all instances **must** share the same `JWT_SECRET_KEY`. Otherwise, a token issued by one replica will be rejected by another.

!!!warning "Excel exports and shared storage"
    The backend writes exported Excel/CSV files to `/app/exports`. If running **multiple replicas**, this directory must be backed by a shared volume (e.g., NFS, EFS, ReadWriteMany PVC) so that any replica can serve a download request for a file created by another replica.

#### Kubernetes Manifest

```yaml
# backend-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: nlex
data:
  TRINO_HOST: "trino"
  TRINO_PORT: "8080"
  CORS_ORIGINS: "https://nlex.example.com"
---
# backend-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: nlex
type: Opaque
stringData:
  DATABASE_URL: "postgresql+asyncpg://nlex:CHANGE_ME@postgresql:5432/nlex_db"
  JWT_SECRET_KEY: "CHANGE_ME_GENERATE_A_STRONG_SECRET"
---
# backend-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backend-exports-pvc
  namespace: nlex
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
---
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: nlex
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      initContainers:
        - name: wait-for-postgres
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z postgresql 5432; do
                echo "Waiting for PostgreSQL..."
                sleep 2
              done
        - name: wait-for-trino
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until wget -q --spider http://trino:8080/v1/info; do
                echo "Waiting for Trino..."
                sleep 2
              done
      containers:
        - name: backend
          image: your-registry.example.com/nlex-backend:latest
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: backend-config
            - secretRef:
                name: backend-secret
          volumeMounts:
            - name: exports
              mountPath: /app/exports
            - name: catalog
              mountPath: /etc/trino/catalog
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "2Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 30
      volumes:
        - name: exports
          persistentVolumeClaim:
            claimName: backend-exports-pvc
        - name: catalog
          persistentVolumeClaim:
            claimName: trino-catalog-pvc
---
# backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: nlex
spec:
  selector:
    app: backend
  ports:
    - port: 8000
      targetPort: 8000
  type: ClusterIP
```

---

### 4. Frontend (Nginx)

| Property | Value |
|---|---|
| **Image** | Custom — multi-stage build from `frontend/Dockerfile` |
| **Port** | `80` (HTTP), `443` (HTTPS with TLS termination) |
| **Health check** | HTTP `200` on `/` |
| **Persistent storage** | None |
| **CPU / Memory** | `100m / 128Mi` (request) — `500m / 512Mi` (limit) |

**Required environment variables (at build time):**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g., `https://api.nlex.example.com`) |

!!!warning "VITE_API_URL is baked at build time"
    Vite injects `VITE_API_URL` into the JavaScript bundle during the build step. This means:

    - You **cannot** change the API URL at runtime by setting an environment variable on the container.
    - If the backend URL changes, you **must rebuild** the frontend Docker image.
    - For different environments (staging, production), build separate images with the appropriate `VITE_API_URL`.

#### Kubernetes Manifest

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: nlex
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: your-registry.example.com/nlex-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
---
# frontend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: nlex
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
---
# frontend-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  namespace: nlex
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - nlex.example.com
      secretName: nlex-tls-secret
  rules:
    - host: nlex.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
```

---

## Important Operational Notes

!!!note "Summary of critical deployment considerations"

### 1. Backend depends on PostgreSQL and Trino

The backend will fail on startup if either PostgreSQL or Trino is unavailable. Use init containers (shown in the manifests above) or a startup probe with a long failure threshold to handle slow startups.

### 2. Trino catalogs are ephemeral

Catalog `.properties` files are written to `/etc/trino/catalog` by the backend. This directory **must** be a shared persistent volume between the backend and Trino containers. If Trino is rescheduled to a different node without this volume, all catalogs are lost.

### 3. `VITE_API_URL` is a build-time variable

The frontend must be rebuilt for each environment that uses a different API URL. There is no runtime configuration for this value.

### 4. `JWT_SECRET_KEY` must be consistent

All backend replicas must use the same `JWT_SECRET_KEY`. Store it in a Kubernetes Secret and mount it into all backend pods via `envFrom`.

### 5. Excel exports need shared storage

The backend writes Excel/CSV exports to `/app/exports`. With multiple replicas, use a `ReadWriteMany` PVC (NFS, EFS, Azure Files) so any pod can serve any export. Alternatively, use object storage (S3) and modify the export logic.

### 6. Database backups

PostgreSQL data is critical. Implement regular backups using:

```bash
# CronJob example
kubectl create cronjob pg-backup \
  --image=postgres:15-alpine \
  --schedule="0 2 * * *" \
  -- pg_dump -U nlex -d nlex_db > /backups/nlex_$(date +%Y%m%d).sql
```

### 7. Namespace isolation

All manifests above use the `nlex` namespace. Create it before applying:

```bash
kubectl create namespace nlex
```

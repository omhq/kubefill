# Selfservice

Simple Jenkins alternative.

## Install

```bash
kubectl create namespace kubefill
kubectl apply -n kubefill -f ./install.yaml
```

## Port Forwarding

```bash
kubectl port-forward svc/kubefill-server -n kubefill 8080:8080
```

## Ingress

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kubefill-server-ingress
  namespace: kubefill
  annotations:
    ingress.kubernetes.io/app-root: "/"
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: domain.com
      http:
        paths:
          - backend:
              service:
                name: kubefill-server
                port:
                  number: 8080
            path: "/"
            pathType: ImplementationSpecific
```

# Development

- Install go 1.19.

```bash
go mod tidy
```

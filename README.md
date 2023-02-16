# Kubefill

Self-service UIs

## Why does this exist

This project puts version controlled html forms and markdown docs between a user and the workloads in your k8s cluster.

![kubefill](https://user-images.githubusercontent.com/849403/219342375-d6798267-4eee-4c5b-b877-e163dbf012cf.jpg)

## Install

```bash
kubectl create namespace kubefill
kubectl apply -n kubefill -f https://raw.githubusercontent.com/kubefill/kubefill/main/manifests/install.yaml
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

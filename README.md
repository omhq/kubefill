# KubeFill

Self-service UIs

## Why does this exist

Sometimes its easier and quicker to fill out a form and click run than to dig up a repo, export envs, set the right kubernetes cluster context, read up some docs as a refresher, and then finally run kubectl commands. This project puts version controlled html forms between a user and the workloads in your kubernetes cluster.

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
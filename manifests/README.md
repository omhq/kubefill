# Installation

```bash
kubectl apply -f namespace.yaml
kubectl apply -f secret-admin.yaml -n kubefill
kubectl apply -f secret-jwt.yaml -n kubefill
kubectl apply -f install.yaml -n kubefill
```

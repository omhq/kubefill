# KubeFill

Self-service UIs

## Ingress

```
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
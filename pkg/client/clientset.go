package client

import (
	"os"

	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type Clientset struct {
	*kubernetes.Clientset
}

func NewClientset() *Clientset {
	return &Clientset{
		connect(),
	}
}

func connect() *kubernetes.Clientset {
	kubeConfig := os.Getenv("KUBECONFIG")
	var clusterConfig *rest.Config
	var err error

	if kubeConfig != "" {
		clusterConfig, err = clientcmd.BuildConfigFromFlags("", kubeConfig)
	} else {
		clusterConfig, err = rest.InClusterConfig()
	}

	if err != nil {
		log.Fatalln(err)
	}

	clientset, err := kubernetes.NewForConfig(clusterConfig)

	if err != nil {
		log.Fatalln(err)
	}

	return clientset
}

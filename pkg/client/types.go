package client

import (
	"github.com/kubefill/kubefill/pkg/job"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/informers"
	coreinformers "k8s.io/client-go/informers/core/v1"
)

type Informer struct {
	clientset  *Clientset
	jobService *job.JobService
}

type PodLoggingController struct {
	informerFactory informers.SharedInformerFactory
	podInformer     coreinformers.PodInformer
	jobService      *job.JobService
	clientset       *Clientset
	pods            map[string]*corev1.Pod
	logsPath        string
}

type JobConfig struct {
	ObjectMeta metav1.ObjectMeta `json:"metadata"`
	Spec       batchv1.JobSpec   `json:"spec"`
	Labels     map[string]string `json:"labels"`
}

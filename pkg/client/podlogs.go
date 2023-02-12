package client

import (
	"bufio"
	"context"

	log "github.com/sirupsen/logrus"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func init() {
	SetDebuglogLevel()
}

func Contains(arr []string, str string) bool {
	for _, a := range arr {
		if a == str {
			return true
		}
	}
	return false
}

func (c *Clientset) StreamPodLogs(ctx context.Context, lines chan string, stop chan interface{}, jobName string, namespace string) {
	pods, err := c.CoreV1().Pods(namespace).List(context.TODO(),
		metav1.ListOptions{LabelSelector: "job-name=" + jobName})

	if err != nil {
		log.Errorln(err)
	}

	for _, Pod := range pods.Items {
		resName := Pod.Name
		since := int64(1)
		if err != nil {
			return
		}
		PodLogsConnection := c.CoreV1().Pods(namespace).GetLogs(resName, &corev1.PodLogOptions{
			Follow:       true,
			SinceSeconds: &since,
		})

		LogStream, err := PodLogsConnection.Stream(context.Background())

		if err != nil {
			log.Errorln(err)
			return
		}

		defer LogStream.Close()
		reader := bufio.NewScanner(LogStream)

		for reader.Scan() {
			lines <- reader.Text()

			if reader.Err() != nil {
				stop <- reader.Err()
				return
			}
		}
	}
}

func (c *Clientset) Run(jobName string, jobConfig JobConfig) (*batchv1.Job, error) {
	jobs := c.BatchV1().Jobs(jobConfig.ObjectMeta.Namespace)
	jobSpec := genereateJobSpec(jobName, jobConfig)
	resp, err := jobs.Create(context.TODO(), jobSpec, metav1.CreateOptions{})
	return resp, err
}

func (c *Clientset) GetJobStatus(jobName string, namespace string) (*batchv1.JobStatus, error) {
	job, err := c.BatchV1().Jobs(namespace).Get(context.TODO(), jobName, metav1.GetOptions{})
	return &job.Status, err
}

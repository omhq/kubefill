package client

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/kubefill/kubefill/pkg/job"
	log "github.com/sirupsen/logrus"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/client-go/informers"
	"k8s.io/client-go/tools/cache"
	"k8s.io/component-base/logs"
)

func (c *PodLoggingController) Run(stopCh chan struct{}) error {
	c.informerFactory.Start(stopCh)
	if !cache.WaitForCacheSync(stopCh, c.podInformer.Informer().HasSynced) {
		return fmt.Errorf("failed to sync")
	}
	return nil
}

type LogMessage struct {
	JobId   uint
	PodName string
	LogLine string
}

// worker sending pod logs to a channel
func (c *PodLoggingController) streamPodLogs(ctx context.Context, jobId uint, pod *corev1.Pod, logsChan chan LogMessage, stopChan chan bool) {
	req := c.clientset.CoreV1().Pods(pod.Namespace).GetLogs(pod.Name, &corev1.PodLogOptions{Follow: true})
	logs, err := req.Stream(ctx)

	if err != nil {
		stopChan <- false
		return
	}

	defer logs.Close()
	s := bufio.NewScanner(logs)

	for s.Scan() {
		logsChan <- LogMessage{
			JobId:   jobId,
			PodName: pod.Name,
			LogLine: s.Text(),
		}
	}

	if err := s.Err(); err != nil {
		log.Errorf("%s error: %s", pod.Name, err)
		stopChan <- false
		return
	}

	stopChan <- true
}

func (c *PodLoggingController) updateJobStatus(id uint, phase string) {
	job, err := c.jobService.Get(id)

	if err == nil {
		job.Phase = phase
		c.jobService.Update(job)
	}
}

func (c *PodLoggingController) podAdd(obj interface{}) {
	pod := obj.(*corev1.Pod)
	labels := pod.ObjectMeta.Labels
	job_id := JobIdAsUint(labels["job_id"])
	log.Infof("pod added for job id %d with phase %s", job_id, string(pod.Status.Phase))
	c.updateJobStatus(job_id, string(pod.Status.Phase))
}

func saveLog(jobId uint, podName string, logMessage string, logsPath string) {
	rootPath := filepath.Join(logsPath, strconv.FormatUint(uint64(jobId), 10), podName)
	err := os.MkdirAll(rootPath, os.ModePerm)

	if err != nil {
		log.Errorln(err)
	}

	f, err := os.OpenFile(filepath.Join(rootPath, "logs.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}
	if _, err := f.Write([]byte(logMessage + "\n")); err != nil {
		log.Fatal(err)
	}
	if err := f.Close(); err != nil {
		log.Fatal(err)
	}
}

func (c *PodLoggingController) podUpdate(old, new interface{}) {
	pod := new.(*corev1.Pod)
	labels := pod.ObjectMeta.Labels
	job_id := JobIdAsUint(labels["job_id"])
	log.Infof("pod %s updated, job id %d, phase %s", job_id, pod.Name, string(pod.Status.Phase))
	c.updateJobStatus(job_id, string(pod.Status.Phase))
	_, ok := c.pods[pod.Name]

	if string(pod.Status.Phase) == "Running" {
		if !ok {
			c.pods[pod.Name] = pod
			ctx := context.Background()

			go func(ctx context.Context) {
				stopChan := make(chan bool)
				logsChan := make(chan LogMessage)
				go c.streamPodLogs(ctx, job_id, pod, logsChan, stopChan)

				for {
					select {
					case logMessage, ok := <-logsChan:
						if ok {
							saveLog(logMessage.JobId, logMessage.PodName, logMessage.LogLine, c.logsPath)
						}
					case stopMsg := <-stopChan:
						close(stopChan)
						close(logsChan)

						if stopMsg {
							return
						}

						if !stopMsg {
							// something went wrong
							return
						}
					}
				}
			}(ctx)
		}
	} else {
		if ok {
			delete(c.pods, pod.Name)
		}
	}
}

func (c *PodLoggingController) podDelete(obj interface{}) {
	pod := obj.(*corev1.Pod)
	log.Infof("pod deleted %s %s", pod.Namespace, pod.Name)
}

func NewPodLoggingController(informerFactory informers.SharedInformerFactory, jobService *job.JobService, clientset *Clientset, logsPath string) *PodLoggingController {
	podInformer := informerFactory.Core().V1().Pods()
	podInformer.Lister()

	c := &PodLoggingController{
		informerFactory: informerFactory,
		podInformer:     podInformer,
		jobService:      jobService,
		clientset:       clientset,
		pods:            map[string]*corev1.Pod{},
		logsPath:        logsPath,
	}
	podInformer.Informer().AddEventHandler(
		cache.ResourceEventHandlerFuncs{
			AddFunc:    c.podAdd,
			UpdateFunc: c.podUpdate,
			DeleteFunc: c.podDelete,
		},
	)
	return c
}

func NewInformer(clientset *Clientset, jobService *job.JobService) *Informer {
	return &Informer{
		clientset:  clientset,
		jobService: jobService,
	}
}

func (s *Informer) StartInformer(logsPath string) {
	flag.Parse()
	logs.InitLogs()
	defer logs.FlushLogs()

	labelOptions := informers.WithTweakListOptions(
		func(opts *metav1.ListOptions) {
			opts.LabelSelector = "invoked="
		})

	factory := informers.NewSharedInformerFactoryWithOptions(
		s.clientset,
		3*time.Minute,
		informers.WithNamespace(""),
		labelOptions)
	controller := NewPodLoggingController(factory, s.jobService, s.clientset, logsPath)
	stop := make(chan struct{})

	defer close(stop)

	err := controller.Run(stop)
	if err != nil {
		log.Fatalln(err)
	}
	select {}
}

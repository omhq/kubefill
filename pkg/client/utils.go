package client

import (
	"os"
	"strconv"

	"github.com/sirupsen/logrus"
	batchv1 "k8s.io/api/batch/v1"
)

func SetDebuglogLevel() {
	lvl, ok := os.LookupEnv("LOG_LEVEL")
	if !ok {
		lvl = "debug"
	}

	ll, err := logrus.ParseLevel(lvl)
	if err != nil {
		ll = logrus.DebugLevel
	}

	logrus.SetLevel(ll)
}

func genereateJobSpec(jobName string, jobConfig JobConfig) *batchv1.Job {
	jobSpec := &batchv1.Job{
		ObjectMeta: jobConfig.ObjectMeta,
		Spec:       jobConfig.Spec,
	}

	jobSpec.ObjectMeta.Name = jobName
	jobSpec.Spec.Template.ObjectMeta.Labels = jobConfig.Labels
	return jobSpec
}

func JobIdAsUint(id string) uint {
	job_uid, _ := strconv.ParseUint(id, 10, 64)
	return uint(job_uid)
}

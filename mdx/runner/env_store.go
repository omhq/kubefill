package runner

import (
	"strings"

	"golang.org/x/exp/slices"
)

type envStore struct {
	values map[string]string
}

func newEnvStore(envs ...string) *envStore {
	s := &envStore{values: make(map[string]string)}
	s.Add(envs...)
	return s
}

func (s *envStore) Add(envs ...string) *envStore {
	for _, env := range envs {
		k, v := splitEnv(env)
		s.values[k] = v
	}
	return s
}

func (s *envStore) Delete(envs ...string) *envStore {
	temp := newEnvStore(envs...)
	for k := range temp.values {
		delete(s.values, k)
	}
	return s
}

func (s *envStore) Values() []string {
	result := make([]string, 0, len(s.values))
	for k, v := range s.values {
		result = append(result, k+"="+v)
	}
	slices.Sort(result)
	return result
}

func diffEnvStores(store, updated *envStore) (newOrUpdated, unchanged, deleted []string) {
	for k, v := range store.values {
		uVal, ok := updated.values[k]
		if !ok {
			deleted = append(deleted, k)
		} else if v != uVal {
			newOrUpdated = append(newOrUpdated, k+"="+uVal)
		} else {
			unchanged = append(unchanged, k)
		}
	}
	for k, v := range updated.values {
		_, ok := store.values[k]
		if ok {
			continue
		}
		newOrUpdated = append(newOrUpdated, k+"="+v)
	}
	return
}

func splitEnv(str string) (string, string) {
	parts := strings.SplitN(str, "=", 2)
	switch len(parts) {
	case 0:
		return "", ""
	case 1:
		return parts[0], ""
	default:
		return parts[0], parts[1]
	}
}

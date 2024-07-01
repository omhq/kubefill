package reposerver

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"

	log "github.com/sirupsen/logrus"
)

func ParseGitURL(url string) (string, string) {
	re := regexp.MustCompile("^git@(.*):([0-9]+)/")
	match := re.FindStringSubmatch(url)
	if match != nil {
		baseUrl := match[1]
		port := match[2]
		return baseUrl, port
	}

	splitResult := strings.Split(url, "@")
	baseUrl := strings.Split(splitResult[1], ":")[0]
	port := "22"

	return baseUrl, port
}

func logError(message string, err error) {
	pc, _, _, _ := runtime.Caller(1)
	functionName := runtime.FuncForPC(pc).Name()

	log.WithFields(log.Fields{
		"function": functionName,
		"error":    err,
	}).Error(message)
}

func CreateKnownHostsFile() {
	knownHostsPath := os.Getenv("HOME") + "/.ssh/known_hosts"
	_, err := os.Stat(knownHostsPath)

	if os.IsNotExist(err) {
		_, err := os.Create(knownHostsPath)
		if err != nil {
			log.Fatalf("failed to create known_hosts file: %s", err)
		}
	} else if err != nil {
		log.Fatalf("failed to check if known_hosts file exists: %s", err)
	}
}

func AddHostToKnownHosts(host string, port string) {
	fmt.Println("Adding host to known_hosts", host, port)

	cmd := exec.Command("ssh-keyscan", "-p", port, host)
	keyscanOutput, err := cmd.Output()
	if err != nil {
		log.Fatalf("failed to scan host keys: %s", err)
	}

	f, err := os.OpenFile(os.Getenv("HOME")+"/.ssh/known_hosts", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("failed to open known_hosts file: %s", err)
	}
	defer f.Close()

	if _, err = f.WriteString(string(keyscanOutput)); err != nil {
		log.Fatalf("failed to write to known_hosts file: %s", err)
	}
}

func CheckHostInKnownHosts(host string) bool {
	file, err := os.Open(os.Getenv("HOME") + "/.ssh/known_hosts")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if strings.Contains(scanner.Text(), host) {
			return true
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	return false
}

func readFile(filePath string) []byte {
	contents, err := os.ReadFile(filePath)
	if err != nil {
		log.Errorln(err)
		fmt.Println(err)
	}

	return contents
}

func initDir(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		err := os.Mkdir(path, os.ModePerm)
		return err
	}

	return nil
}

func getFullRepoDir(rootDir string, owner string, repoName string) string {
	return fmt.Sprintf("%s/%s-%s", rootDir, owner, repoName)
}

func doSync(repoId string, repoUrl string, repoBranch string, repoDir string) (*git.Repository, error) {
	os.Setenv("SSH_KNOWN_HOSTS", "/root/.ssh/known_hosts")

	fmt.Println("Syncing repo", repoId, repoUrl, repoBranch, repoDir)

	if _, err := os.Stat(repoDir); os.IsNotExist(err) {
		r, err := cloneRepo(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
			logError("failed to clone", err)
			return nil, err
		}

		return r, nil
	}

	if _, err := os.Stat(repoDir); !os.IsNotExist(err) {
		r, err := pullRepo(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
			logError("failed to pull", err)
			return nil, err
		}

		return r, nil
	}

	return nil, nil
}

func getPublicKey(dirPath string) (*ssh.PublicKeys, error) {
	var publicKey *ssh.PublicKeys
	sshPath := dirPath + "/" + PRIVATE_KEY
	sshKey, err := os.ReadFile(sshPath)

	if err != nil {
		logError("failed to read public key", err)
		return nil, err
	}

	publicKey, err = ssh.NewPublicKeys("git", sshKey, "")

	if err != nil {
		logError("failed to init public key", err)
		return nil, err
	}

	return publicKey, err
}

func cloneRepo(repoId string, repoUrl string, repoBranch string, repoDir string) (*git.Repository, error) {
	log.Infof("git clone -b %s --single-branch %s %s", repoBranch, repoUrl, repoDir)
	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, err := getPublicKey(dirPath)
	referenceName := fmt.Sprintf("refs/heads/%s", repoBranch)

	if err != nil {
		logError("failed to get public key", err)
		return nil, err
	}

	r, err := git.PlainClone(repoDir, false, &git.CloneOptions{
		Progress:      os.Stdout,
		URL:           repoUrl,
		Auth:          auth,
		ReferenceName: plumbing.ReferenceName(referenceName),
		SingleBranch:  true,
	})

	if err != nil {
		logError("git.PlainClone failed", err)
		return nil, err
	}

	return r, nil
}

func pullBranch(r *git.Repository, repoId string, repoBranch string) error {
	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, err := getPublicKey(dirPath)

	if err != nil {
		log.Errorln(err)
		return err
	}

	w, err := r.Worktree()

	if err != nil {
		log.Errorln(err)
		return err
	}

	err = w.Pull(&git.PullOptions{
		Progress:      os.Stdout,
		RemoteName:    "origin",
		Auth:          auth,
		ReferenceName: plumbing.ReferenceName(fmt.Sprintf("refs/heads/%s", repoBranch)),
	})

	if err != nil {
		log.Errorln(err)

		if err == git.NoErrAlreadyUpToDate {
			return nil
		}

		return err
	}

	return nil
}

func pullRepo(repoId string, repoUrl string, repoBranch string, repoDir string) (*git.Repository, error) {
	log.Infof("git pull origin %s", repoBranch)
	r, err := git.PlainOpen(repoDir)

	if err != nil {
		log.Errorln(err)
		return nil, err
	}

	h, err := r.Head()

	if err != nil {
		log.Errorln(err)
		return nil, err
	}

	currentBranch := strings.TrimPrefix(string(h.Name()), "refs/heads/")

	if currentBranch == repoBranch {
		err := pullBranch(r, repoId, repoBranch)

		if err != nil {
			log.Errorln(err)
			return nil, err
		}
	} else {
		err := os.RemoveAll(repoDir)

		if err != nil {
			log.Errorln(err)
			return nil, err
		}

		r, err = doSync(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
			log.Errorln(err)
			return nil, err
		}
	}

	return r, nil
}

func contains(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

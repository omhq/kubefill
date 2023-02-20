package reposerver

import (
	"fmt"
	"os"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	giturl "github.com/kubescape/go-git-url"
	log "github.com/sirupsen/logrus"
)

func readFile(filePath string) []byte {
	contents, err := os.ReadFile(filePath)
	if err != nil {
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

func getFullRepoDir(rootDir string, giturl giturl.IGitURL) string {
	return fmt.Sprintf("%s/%s-%s", rootDir, giturl.GetOwnerName(), giturl.GetRepoName())
}

func doSync(repoId string, repoUrl string, repoBranch string, repoDir string) (*git.Repository, error) {
	if _, err := os.Stat(repoDir); os.IsNotExist(err) {
		r, err := cloneRepo(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
			return nil, err
		}

		return r, nil
	}

	if _, err := os.Stat(repoDir); !os.IsNotExist(err) {
		r, err := pullRepo(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
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
		return nil, err
	}

	publicKey, err = ssh.NewPublicKeys("git", sshKey, "")

	if err != nil {
		return nil, err
	}

	return publicKey, err
}

func cloneRepo(repoId string, repoUrl string, repoBranch string, repoDir string) (*git.Repository, error) {
	log.Infof("git clone -b %s --single-branch %s %s", repoBranch, repoUrl, repoDir)
	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, keyErr := getPublicKey(dirPath)
	referenceName := fmt.Sprintf("refs/heads/%s", repoBranch)

	if keyErr != nil {
		return nil, keyErr
	}

	r, err := git.PlainClone(repoDir, false, &git.CloneOptions{
		Progress:      os.Stdout,
		URL:           repoUrl,
		Auth:          auth,
		ReferenceName: plumbing.ReferenceName(referenceName),
		SingleBranch:  true,
	})

	if err != nil {
		return nil, err
	}

	return r, nil
}

func pullBranch(r *git.Repository, repoId string, repoBranch string) error {
	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, err := getPublicKey(dirPath)

	if err != nil {
		return err
	}

	w, err := r.Worktree()

	if err != nil {
		return err
	}

	err = w.Pull(&git.PullOptions{
		Progress:      os.Stdout,
		RemoteName:    "origin",
		Auth:          auth,
		ReferenceName: plumbing.ReferenceName(fmt.Sprintf("refs/heads/%s", repoBranch)),
	})

	if err != nil {
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
		return nil, err
	}

	h, err := r.Head()

	if err != nil {
		return nil, err
	}

	currentBranch := strings.TrimPrefix(string(h.Name()), "refs/heads/")

	if currentBranch == repoBranch {
		err := pullBranch(r, repoId, repoBranch)

		if err != nil {
			return nil, err
		}
	} else {
		err := os.RemoveAll(repoDir)

		if err != nil {
			return nil, err
		}

		r, err = doSync(repoId, repoUrl, repoBranch, repoDir)

		if err != nil {
			return nil, err
		}
	}

	return r, nil
}

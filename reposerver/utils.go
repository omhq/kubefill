package reposerver

import (
	"fmt"
	"os"

	"github.com/go-git/go-git/v5"
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

func doSync(repoId string, repoUrl string, repoDir string) (*git.Repository, error) {
	if _, err := os.Stat(repoDir); os.IsNotExist(err) {
		r, err := cloneRepo(repoId, repoUrl, repoDir)

		if err != nil {
			return nil, err
		}

		return r, nil
	}

	if _, err := os.Stat(repoDir); !os.IsNotExist(err) {
		r, err := pullRepo(repoId, repoDir)

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

func cloneRepo(repoId string, repoUrl string, repoDir string) (*git.Repository, error) {
	log.Infof("cloning %s into %s", repoUrl, repoDir)
	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, keyErr := getPublicKey(dirPath)

	if keyErr != nil {
		return nil, keyErr
	}

	r, err := git.PlainClone(repoDir, false, &git.CloneOptions{
		Progress: os.Stdout,
		URL:      repoUrl,
		Auth:     auth,
	})

	if err != nil {
		return nil, err
	}

	return r, nil
}

func pullRepo(repoId string, repoDir string) (*git.Repository, error) {
	log.Infof("pulling %s", repoDir)
	r, err := git.PlainOpen(repoDir)

	if err != nil {
		return nil, err
	}

	w, err := r.Worktree()

	if err != nil {
		return nil, err
	}

	dirPath := os.Getenv(SSH_ROOT) + "/" + repoId
	auth, keyErr := getPublicKey(dirPath)

	if keyErr != nil {
		return nil, keyErr
	}

	err = w.Pull(&git.PullOptions{
		Progress:   os.Stdout,
		RemoteName: "origin",
		Auth:       auth,
	})

	if err != nil {
		if err == git.NoErrAlreadyUpToDate {
			return r, nil
		}

		return nil, err
	}

	return r, nil
}

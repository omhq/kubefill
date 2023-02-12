package reposerver

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	giturl "github.com/kubescape/go-git-url"
	log "github.com/sirupsen/logrus"
	"golang.org/x/net/context"
	structpb "google.golang.org/protobuf/types/known/structpb"
)

const (
	REPO_ROOT   = "REPO_ROOT"
	SSH_ROOT    = "SSH_ROOT"
	PRIVATE_KEY = "private_key"
)

type RepoService struct {
	repoRoot string
	sshRoot  string
	UnimplementedRepoServiceServer
}

func (s RepoService) Init() {
	err := initDir(s.repoRoot)

	if err != nil {
		log.Fatalln(err)
	}

	err = initDir(s.sshRoot)

	if err != nil {
		log.Fatalln(err)
	}
}

func (s RepoService) RemoveSshKey(_ context.Context, request *RemoveSshKeyRequest) (*RemoveSshKeyResponse, error) {
	sshRoot := os.Getenv(SSH_ROOT)
	sshRootPath := filepath.Join(sshRoot, request.RepoId)
	err := os.RemoveAll(sshRootPath)
	if err != nil {
		return nil, err
	}

	return &RemoveSshKeyResponse{}, nil
}

func (s RepoService) SaveSshKey(_ context.Context, request *SaveSshKeyRequest) (*SaveSshKeyResponse, error) {
	var mode fs.FileMode = 0777

	sshKey := request.SshKey
	sshRoot := os.Getenv(SSH_ROOT)
	sshRootPath := filepath.Join(sshRoot, request.RepoId)
	sshPath := filepath.Join(sshRootPath, PRIVATE_KEY)

	if _, err := os.Stat(sshRootPath); os.IsNotExist(err) {
		err := os.Mkdir(sshRootPath, mode)

		if err != nil {
			return nil, err
		}
	}

	fo, err := os.OpenFile(sshPath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, mode)

	if err != nil {
		return nil, err
	}

	defer func() {
		if err := fo.Close(); err != nil {
			log.Errorln(err)
		}
	}()

	data := []byte(sshKey)
	err = fo.Truncate(0)

	if err != nil {
		return nil, err
	}

	_, err = fo.Seek(0, 0)

	if err != nil {
		return nil, err
	}

	_, err = fo.Write(data)

	if err != nil {
		return nil, err
	}

	return &SaveSshKeyResponse{}, nil
}

func (s RepoService) Sync(_ context.Context, syncRequest *SyncRequest) (*SyncResponse, error) {
	repo := syncRequest.Repo
	gitURL, err := giturl.NewGitURL(repo)

	if err != nil {
		return nil, err
	}

	r, err := doSync(syncRequest.RepoId, repo, getFullRepoDir(s.repoRoot, gitURL))

	if err != nil {
		return nil, err
	}

	ref, err := r.Head()

	if err != nil {
		return nil, err
	}

	commit, err := r.CommitObject(ref.Hash())

	if err != nil {
		return nil, err
	}

	return &SyncResponse{
		Hash:   ref.Hash().String(),
		Commit: commit.Message,
	}, nil
}

func (s RepoService) GetRepoDir(_ context.Context, repoDirRequest *RepoDirRequest) (*RepoDirResponse, error) {
	repoDirResp := RepoDirResponse{}
	gitURL, err := giturl.NewGitURL(repoDirRequest.RepoUrl)

	if err != nil {
		log.Errorln(err)
	}

	repoDirResp.Path = fmt.Sprintf("%s-%s", gitURL.GetOwnerName(), gitURL.GetRepoName())
	return &repoDirResp, nil
}

func (s RepoService) GetPaths(_ context.Context, pathsRequest *PathsRequest) (*PathsResponse, error) {
	pathsResp := PathsResponse{
		RepoRoot:   os.Getenv(REPO_ROOT),
		SshRoot:    os.Getenv(SSH_ROOT),
		PrivateKey: PRIVATE_KEY,
	}
	return &pathsResp, nil
}

func (s RepoService) GetManifests(_ context.Context, manifestsRequest *ManifestsRequest) (*ManifestsResponse, error) {
	manifestResp := ManifestsResponse{}
	rootDir := os.Getenv(REPO_ROOT)
	repoRoot := filepath.Join(rootDir, manifestsRequest.Path)
	files, err := os.ReadDir(repoRoot)
	allowedFiles := map[string]string{
		"data":     "",
		"schema":   "",
		"uischema": "",
	}

	for _, file := range files {
		if !file.IsDir() {
			var fullFileName = file.Name()
			var baseFileName = strings.TrimSuffix(fullFileName, filepath.Ext(fullFileName))
			_, ok := allowedFiles[baseFileName]

			if ok {
				var result map[string]interface{}
				contents := readFile(filepath.Join(repoRoot, file.Name()))
				json.Unmarshal([]byte(contents), &result)
				details, err := structpb.NewStruct(result)

				if err != nil {
					panic(err)
				}

				if baseFileName == "data" {
					manifestResp.Data = details
				}

				if baseFileName == "schema" {
					manifestResp.Schema = details
				}

				if baseFileName == "uischema" {
					manifestResp.UiSchema = details
				}
			}
		}
	}

	if err != nil {
		fmt.Println(err)
	}

	return &manifestResp, nil
}

package reposerver

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	log "github.com/sirupsen/logrus"
	"golang.org/x/net/context"
	structpb "google.golang.org/protobuf/types/known/structpb"
	"k8s.io/apimachinery/pkg/util/yaml"
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
	repoId := syncRequest.RepoId
	branch := syncRequest.Branch

	components := strings.Split(repo, ":")
	repoParts := strings.Split(components[len(components)-1], "/")
	owner := repoParts[len(repoParts)-2]
	repoName := strings.TrimSuffix(repoParts[len(repoParts)-1], ".git")

	baseUrl, port := ParseGitURL(repo)
	CreateKnownHostsFile()

	if !CheckHostInKnownHosts(baseUrl) {
		fmt.Println("Host not in known_hosts", baseUrl, port)
		AddHostToKnownHosts(baseUrl, port)
	}

	r, err := doSync(repoId, repo, branch, getFullRepoDir(s.repoRoot, owner, repoName))

	if err != nil {
		logError("failed to sync", err)
		return nil, err
	}

	ref, err := r.Head()

	if err != nil {
		logError("failed to fetch head reference", err)
		return nil, err
	}

	commit, err := r.CommitObject(ref.Hash())

	if err != nil {
		log.Errorln(err)
		return nil, err
	}

	return &SyncResponse{
		Hash:   ref.Hash().String(),
		Commit: commit.Message,
	}, nil
}

func (s RepoService) GetRepoDir(_ context.Context, repoDirRequest *RepoDirRequest) (*RepoDirResponse, error) {
	fmt.Println("Getting repo dir for", repoDirRequest.RepoUrl)

	repo := repoDirRequest.RepoUrl
	repoDirResp := RepoDirResponse{}

	components := strings.Split(repo, ":")
	repoParts := strings.Split(components[len(components)-1], "/")
	owner := repoParts[len(repoParts)-2]
	repoName := strings.TrimSuffix(repoParts[len(repoParts)-1], ".git")

	repoDirResp.Path = fmt.Sprintf("%s-%s", owner, repoName)
	return &repoDirResp, nil
}

func (s RepoService) GetPaths(_ context.Context, pathsRequest *PathsRequest) (*PathsResponse, error) {
	fmt.Println("Getting paths", pathsRequest)
	pathsResp := PathsResponse{
		RepoRoot:   os.Getenv(REPO_ROOT),
		SshRoot:    os.Getenv(SSH_ROOT),
		PrivateKey: PRIVATE_KEY,
	}
	return &pathsResp, nil
}

func (s RepoService) GetManifests(_ context.Context, manifestsRequest *ManifestsRequest) (*ManifestsResponse, error) {
	fmt.Println("Getting manifests", manifestsRequest)
	manifestResp := ManifestsResponse{}
	rootDir := os.Getenv(REPO_ROOT)
	repoRoot := filepath.Join(rootDir, manifestsRequest.Path)

	fmt.Println("Reading from", repoRoot)

	files, err := os.ReadDir(repoRoot)
	validYamlExt := []string{".yaml", ".yml"}
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
				path := filepath.Join(repoRoot, file.Name())
				ext := filepath.Ext(path)
				contents := readFile(path)

				if contains(validYamlExt, ext) {
					yaml.Unmarshal([]byte(contents), &result)
				} else {
					json.Unmarshal([]byte(contents), &result)
				}

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

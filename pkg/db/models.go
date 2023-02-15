package db

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Application struct {
	ID           uint `gorm:"primary_key" json:"id"`
	gorm.Model   `json:"model"`
	Name         string `json:"name"`
	RepoID       uint   `json:"repo_id"`
	ManifestPath string `json:"manifest_path"`
	Status       int    `json:"status"`
	Jobs         []Job
	Secrets      []Secret
}

type Job struct {
	ID            uint `gorm:"primary_key" json:"id"`
	gorm.Model    `json:"model"`
	Name          string         `json:"name"`
	ApplicationID uint           `json:"application_id"`
	Phase         string         `json:"phase"`
	Spec          datatypes.JSON `json:"spec"`
	Meta          datatypes.JSON `json:"meta"`
}

type Repo struct {
	ID         uint `gorm:"primary_key" json:"id"`
	gorm.Model `json:"model"`
	Url        string `json:"url"`
	Hash       string `json:"hash"`
	Commit     string `json:"commit"`
}

type Secret struct {
	ID            uint `gorm:"primary_key" json:"id"`
	gorm.Model    `json:"model"`
	ApplicationID uint   `json:"application_id"`
	Name          string `json:"name"`
	Value         string `json:"value"`
}

type User struct {
	gorm.Model
	Name     string `json:"name"`
	Username string `json:"username" gorm:"unique"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"password"`
}

func (user *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return err
	}
	user.Password = string(bytes)
	return nil
}

func (user *User) CheckPassword(providedPassword string) error {
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(providedPassword))
	if err != nil {
		return err
	}
	return nil
}

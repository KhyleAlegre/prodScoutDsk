import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { IpcService } from 'src/app/services/ipc.service';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable, concatWith } from 'rxjs';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { profileModels } from 'src/app/models/profile.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  constructor(
    private router: Router,
    private electronService: ElectronService,
    private ipcService: IpcService,
    private cdRef: ChangeDetectorRef,
    private afs: AngularFirestore,
    private afsU: AngularFireStorage
  ) {}
  private profileCollection!: AngularFirestoreCollection<profileModels>;
  profiles!: Observable<profileModels[]>;

  private logprofileCollection!: AngularFirestoreCollection<profileModels>;
  logprofiles!: Observable<profileModels[]>;

  profileId: any;
  username: any;
  invalidPassword: boolean = false;
  invalidId: boolean = false;
  passwordPrompt: any;
  profilePromt: any;
  logPrompt: boolean = false;
  logNotify: any;
  pong: any;
  ssUrl: any;
  appLogs: any;
  profileList!: profileModels[];
  logprofileList!: profileModels[];
  connectCheck: any;
  logDate: any;
  loggedProfileId: any;
  loggedUsername: any;
  nudgeRequest: boolean = false;
  ssRequest: boolean = false;
  imagePathName: any;
  imageRef: any;
  imageBaseRef: any;
  imageSub: any;
  downloadUrl: any;
  convertedUrl: any;
  galleryUrl: any;
  sessionUrl: any;
  galleryLogDate: any;
  convertBlob: any;

  ngOnInit(): void {
    this.profileCollection = this.afs.collection('profiles');
    this.profiles = this.profileCollection.valueChanges();
    this.profiles.subscribe(
      (data) => ((this.profileList = data), console.log(this.profileList))
    );

    setInterval(() => {
      // Listen to Window Events
      this.ipcService.send('check', 'checking');
      this.getProfile();
      // Gets Window Events
      this.ipcService.on('appLogs', (event: any, arg: string) => {
        this.appLogs = arg;
        // Add Logs
        this.logDate = new Date();
        this.afs.collection('profileLogs').add({
          eventDetails:
            this.appLogs.windowClass +
            ' / ' +
            this.appLogs.windowName +
            ' is currently active',
          isIncognito: 'Windows PC',
          logDate: this.logDate,
          profileName: this.loggedProfileId,
          userName: this.loggedUsername,
        });

        this.cdRef.detectChanges();
      });
    }, 60000);

    setInterval(() => {
      this.getProfile();
      this.checkNudge();
      this.checkSS();
    }, 5000);
  }

  login() {
    if (!this.profileId) {
      this.invalidId = true;
      this.profilePromt = 'Profile Id is required';
    } else {
      this.invalidId = false;
      this.profilePromt = '';
    }

    if (!this.username) {
      this.invalidPassword = true;
      this.passwordPrompt = 'Username is required';
    } else {
      this.invalidPassword = false;
      this.passwordPrompt = '';
    }

    for (let i = 0; i < this.profileList.length; i++) {
      console.log(this.username);
      console.log(this.profileId);
      if (
        this.profileId == this.profileList[i].profileId &&
        this.username == this.profileList[i].username
      ) {
        this.logNotify = 'We are now scouting this machine';
        this.logPrompt = true;
        localStorage.setItem('logProfile', this.profileId);
        localStorage.setItem('logUser', this.username);
        this.checkConnect();
        setTimeout(() => {
          this.logNotify = '';
          this.logPrompt = false;
          this.username = '';
          this.profileId = '';
        }, 5000);
        return;
      } else {
        this.logNotify = 'Invalid Credentials';
        this.logPrompt = true;
      }
    }
  }
  // Setup communication between the App and Windows Shells
  checkConnect() {
    this.ipcService.send('message', 'ping');
    this.ipcService.on('reply', (event: any, arg: string) => {
      this.pong = arg;
      if (this.pong == true) {
        this.connectCheck = 'This device is now being scouted';
      }
      this.cdRef.detectChanges();
    });
  }
  // Get firestore Data
  getProfile() {
    this.loggedProfileId = localStorage.getItem('logProfile');
    this.loggedUsername = localStorage.getItem('logUser');
    console.log(this.loggedProfileId, this.loggedUsername);

    this.logprofileCollection = this.afs.collection('profiles', (ref) =>
      ref
        .where('profileId', '==', this.loggedProfileId)
        .where('username', '==', this.loggedUsername)
    );

    this.logprofiles = this.logprofileCollection.valueChanges();
    this.logprofiles.subscribe(
      (data) => (
        (this.logprofileList = data),
        console.log(this.logprofileList),
        (this.nudgeRequest = this.logprofileList[0].nudge),
        (this.ssRequest = this.logprofileList[0].ssrequest)
      )
    );
  }

  checkNudge() {
    if (this.nudgeRequest == true) {
      // Nudge
      this.ipcService.send('watch', 'looking');
    }
  }

  checkSS() {
    if (this.ssRequest == true) {
      this.getScreenshot();
      console.log('ready to upload', this.ssUrl);
      this.imagePathName = 'gallery' + Math.random();
      this.imageRef = this.afsU.ref(this.imagePathName);

      //this.imageBaseRef = this.afsU.upload(this.imagePathName, this.ssUrl);
      this.imageRef.putString(this.ssUrl, 'base64', {
        contentType: 'image/png',
      });
      this.imageSub = this.imageBaseRef
        .snapshotChanges()
        .pipe(concatWith(this.imageRef.getDownloadURL()))
        .subscribe((url: Observable<string>) => {
          this.downloadUrl = url;
          this.galleryUrl = this.downloadUrl;
          this.galleryLogDate = new Date();
          this.afs.collection('gallery').add({
            ssUrl: this.galleryUrl,
            profileId: this.loggedProfileId,
            userName: this.loggedUsername,
          });
        });
    }
  }

  getScreenshot() {
    // Screenshot
    this.ipcService.send('screenshot', 'sendSS');
    this.ipcService.on('capture', (event: any, arg: string) => {
      this.ssUrl = arg;
      //console.log(this.ssUrl);
      this.cdRef.detectChanges();
    });
  }
}

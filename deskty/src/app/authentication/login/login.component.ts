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
import { ssModel } from 'src/app/models/screenshot.model';
import { watchlistModel } from 'src/app/models/watchlist.model';
import { userModel } from 'src/app/models/users.model';

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

  private watchlistCollection!: AngularFirestoreCollection<watchlistModel>;
  wls!: Observable<watchlistModel[]>;

  private userCollection!: AngularFirestoreCollection<userModel>;
  users!: Observable<userModel[]>;

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
  galleryUrl: any;
  sessionUrl: any;
  galleryLogDate: any;
  convertBlob: any;
  watchList!: watchlistModel[];
  sessionTimeStamp: any;
  strictMode: boolean = true;
  holidayMode: boolean = false;
  email: any;
  contactNo: any;
  profileUsername: any;
  userList!: userModel[];

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
      this.checkNudge();
      this.checkSS();
      this.getWatchlist();
      this.getUser();
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
        if (this.strictMode == true) {
          // Comparet to watchlist
          for (let i = 0; i < this.watchList.length; i++) {
            if (this.appLogs.windowClass == this.watchList[i].applicationName) {
              setTimeout(() => {
                this.getScreenshot();

                this.galleryLogDate = new Date();
                this.afs.collection('gallery').add({
                  ssUrl: this.ssUrl,
                  profileId: this.loggedProfileId,
                  userName: this.loggedUsername,
                  logDate: this.galleryLogDate,
                });

                this.ipcService.send('warn', 'warning');
              }, 500);
              this.sessionTimeStamp = new Date();
              this.afs.collection('sessions').add({
                deviceType: 'Desktop',
                sessionMode: 'Launched ' + this.appLogs.windowClass,
                sessionStatus: true,
                photoUrl: this.ssUrl,
                sessiongLogDate: this.sessionTimeStamp,
                displaySessionDate: this.sessionTimeStamp.toLocaleDateString(),
                displaySessionTime:
                  this.sessionTimeStamp.toLocaleTimeString('en-US'),
                profileId: this.loggedProfileId,
                profileType: 'Regular',
                violationLevel: 'Launched an application from the watchlist',
                screenShotTrigger: '',
                profileStatus: 'Active',
                profilePassword: 'N/A',
                username: this.loggedUsername,
              });

              // Send Email
              console.log('Email', this.email, this.loggedProfileId);
              this.afs.collection('mail').add({
                to: this.email,
                message: {
                  subject: 'Scout Alert - Suspicious Desktop Activity',
                  html:
                    'Our scouts have noticed an unusual activity from ' +
                    this.loggedProfileId +
                    ', We have logged this activity and saved a screenshot. log to the app to check',
                },
              });

              // Send SMS
              console.log('SMS', this.contactNo, this.loggedProfileId);
              this.afs.collection('messages').add({
                to: this.contactNo,
                body:
                  this.loggedProfileId +
                  ' has accessed a desktop application from your watchlist, log to the app to check',
              });
            }
            return;
          }
        }

        this.cdRef.detectChanges();
      });
    }, 10000);

    // setInterval(() => {
    //  this.getProfile();
    //  this.checkNudge();
    //  this.checkSS();
    //   this.getWatchlist();
    // }, 3000);
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
        (this.nudgeRequest = this.logprofileList[0].nudge),
        (this.ssRequest = this.logprofileList[0].ssrequest),
        (this.strictMode = this.logprofileList[0].strictMode),
        (this.holidayMode = this.logprofileList[0].holidayMode),
        (this.profileUsername = this.logprofileList[0].username)
      )
    );
  }

  getUser() {
    this.userCollection = this.afs.collection('users', (ref) =>
      ref.where('username', '==', this.profileUsername)
    );

    this.users = this.userCollection.valueChanges();
    this.users.subscribe(
      (data) => (
        (this.userList = data),
        (this.contactNo = this.userList[0].contactNo),
        (this.email = this.userList[0].email)
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
      this.galleryLogDate = new Date();
      this.afs.collection('gallery').add({
        ssUrl: this.ssUrl,
        profileId: this.loggedProfileId,
        userName: this.loggedUsername,
        logDate: this.galleryLogDate,
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

  openSite() {
    this.ipcService.send('browser', 'openBrowser');
  }

  addToGallery() {
    this.galleryLogDate = new Date();
    this.afs.collection('gallery').add({
      ssUrl: this.ssUrl,
      profileId: this.loggedProfileId,
      userName: this.loggedUsername,
      logDate: this.galleryLogDate,
    });
  }

  getWatchlist() {
    this.watchlistCollection = this.afs.collection('watchlist', (ref) =>
      ref.where('username', '==', this.loggedUsername)
    );
    this.wls = this.watchlistCollection.valueChanges();
    this.wls.subscribe(
      (data) => ((this.watchList = data), console.log(this.watchList))
    );
  }
}

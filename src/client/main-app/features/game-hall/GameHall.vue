<template>
<div class="game-hall__container">
  <button class="game-hall__create-btn" @click="createGame">创建游戏</button>
</div>
</template>

<script>
import AgoraRTC from 'agora-rtc';

import {
  addOneUser,
  removeUserStream,
  setUserStream,
} from '../../vuex/actions';
import agoraUtils from '../../libs/agora_utils';

export default {
  name: 'GameHall',

  vuex: {
    actions: {
      addOneUser,
      removeUserStream,
      setUserStream,
    },
    getters: {
      agoraClient: (state) => state.agoraClient,
      currentUser: (state) => {
        for (let i = 0; i < state.users.length; i++) {
          if (state.users[i].id === state.currentUserId) {
            return state.users[i];
          }
        }
        return null;
      },
    },
  },

  data() {
    return {
      uid: 0,
      resolution: '120p',
      maxFrameRate: 15,
      key: '0d592690c25548cf8b79643d2b7e4bb3',
      channel: '123',
      localStreamId: null,
      errorMessage: '',
    };
  },

  ready() {
    this.initAgoraClient();
    this.addOneUser({ id: 333 });
  },

  methods: {
    initAgoraClient() {
      this.agoraClient.init(this.key, () => {
        console.log('AgoraRTC client initialized');
        this.subscribeStreamEvents();
      }, (err) => {
        console.error('Failed to initialize AgoraRTC client: ', err);
        if (err) {
          switch (err.reason) {
          case 'CLOSE_BEFORE_OPEN':
            this.errorMessage = 'to use voice/video functions, you need to run Agora Media Agent first, if you do not have it installed, please visit url(' + err.agentInstallUrl + ') to install it.';
            break;
          case 'ALREADY_IN_USE':
            this.errorMessage = 'Agora Video Call is running on another tab already.';
            break;
          case 'INVALID_CHANNEL_NAME':
            this.errorMessage = 'Invalid channel name, Chinese characters are not allowed in channel name.';
            break;
          default:
            this.errorMessage = '未知错误';
          }
        }
      });
    },

    subscribeStreamEvents() {
      this.agoraClient.on('stream-added', (evt) => {
        const stream = evt.stream;
        console.log('New stream added: ' + stream.getId());
        console.log('Timestamp: ' + Date.now());
        console.log('Subscribe ', stream);
        this.agoraClient.subscribe(stream, (err) => {
          console.log('Subscribe stream failed', err);
        });
      });

      this.agoraClient.on('peer-leave', (evt) => {
        console.log('Peer has left: ' + evt.uid);
        console.log('Timestamp: ' + Date.now());
        console.log(evt);
        // showStreamOnPeerLeave(evt.uid);
        //updateRoomInfo();
      });

      this.agoraClient.on('stream-subscribed', (evt) => {
        const stream = evt.stream;
        console.log('Got stream-subscribed event');
        console.log('Timestamp: ' + Date.now());
        console.log('Subscribe remote stream successfully: ' + stream.getId());
        console.log(evt);
        this.showStreamOnPeerAdded(stream);
        //updateRoomInfo();
      });

      this.agoraClient.on('stream-removed', (evt) => {
        const stream = evt.stream;
        console.log('Stream removed: ' + stream.getId());
        console.log('Timestamp: ' + Date.now());
        console.log(evt);
        // showStreamOnPeerLeave(stream.getId());
        //updateRoomInfo();
      });
    },

    createGame() {
      this
      .createGameRoom(this.channel)
      .then(this.createLocalStream)
      .then(this.initLocalStream)
      .then(this.publishLocalStream)
      .then(() => {
        this.$route.router.go({
          name: 'game-room',
          params: { roomId: this.channel },
        });
      })
      .catch((err) => {
        console.error(err);
        this.errorMessage = err;
      });
    },

    createGameRoom(roomId) {
      return new Promise((resolve, reject) => {
        this.agoraClient.join(
          this.key,
          roomId,
          this.currentUser.id,
          (uid) => {
            console.log('用户 ' + uid + ' 成功创建了房间');
            console.log('Timestamp: ' + Date.now());
            resolve();
          },
          (err) => {
            console.error(err);
            reject('创建房间失败: ', err);
          });
      });
    },

    createLocalStream() {
      this.setUserStream(this.currentUser.id, AgoraRTC.createStream({
        streamID: this.currentUser.id,
        audio: true,
        video: true,
        screen: false,
        local: true,
      }));
      console.log('创建 LocalStream 成功');
      return Promise.resolve();
    },

    initLocalStream() {
      const videoProfile = agoraUtils.generateVideoProfile(this.resolution, this.maxFrameRate);
      this.currentUser.stream.setVideoProfile(videoProfile);

      return new Promise((resolve, reject) => {
        this.currentUser.stream.init(() => {
          console.log('Get UserMedia successfully');
          resolve();
          // console.log(this.localStream);

          // this.localStreamId = this.localStream.getId();

          // const size = agora.calculateVideoSize(false, window.width, window.height, this.resolution);
          // this.displayStream(this.localStream);
        }, (err) => {
          console.log('Local stream init failed.', err);
          reject('Please check camera or audio devices on your computer, then try again.');
        });
      });
    },

    publishLocalStream() {
      return new Promise((resolve, reject) => {
        this.agoraClient.publish(this.currentUser.stream, () => {
          console.log('Timestamp: ' + Date.now());
          console.log('LocalStream已发布');
          resolve();
        });

        this.agoraClient.on('stream-published', () => {
          console.log('Local stream published');
          resolve();
        });
      });
    },

    showStreamOnPeerAdded(stream) {
      this.addOneUser({ id: stream.getId(), stream });
    },

  },
};
</script>

<style lang="stylus">
.game-hall
  &__container
    position absolute
    left 50%
    top 50%
    transform translate(-50%, -50%)
    text-align center
    background-color black
  &__create-btn
    height 50px
    padding 10px 30px
    font-size 18px
    color white
    border 1px solid white
    border-radius 2px
    background-color transparent
    cursor pointer
</style>

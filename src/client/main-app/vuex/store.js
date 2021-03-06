import Vue from 'vue';
import Vuex from 'vuex';
import AgoraRTC from 'agora-rtc';

Vue.nonreactive = function nonreactive(value) {
  const Observer = (new Vue()).$data.__ob__.constructor;
  // Set dummy observer on value
  value.__ob__ = new Observer({});
  return value;
};
Vue.use(Vuex);

// Get login user
const currentUser = window.WEREWOLF ? window.WEREWOLF.data : { id: 0, email: 'demo@werewolf.com' };

const initialState = {
  agoraClient: Vue.nonreactive(AgoraRTC.createRtcClient()),
  currentUserId: currentUser.id,
  users: [currentUser],
  userLength: 1,
  focusedUserId: null,
};

const mutations = {
  SET_FOCUSED_USER_ID (state, userId) {
    state.focusedUserId = userId;
  },

  ADD_USER (state, user) {
    for (let i = 0; i < state.users.length; i++) {
      if (state.users[i].id === user.id) {
        state.users.$set(i, user);
        return;
      }
    }
    state.users.push(user);
  },

  REMOVE_USER_STREAM (state, userId) {
    for (let i = 0; i < state.users.length; i++) {
      if (state.users[i].id === userId) {
        state.users[i].stream.close();
        state.users.$set(i, { id: userId, stream: null, displaying: false });
        return;
      }
    }
  },

  SET_USER_STREAM (state, userId, stream) {
    for (let i = 0; i < state.users.length; i++) {
      if (state.users[i].id === userId) {
        if (state.users[i].stream) {
          state.users[i].stream.close();
        }
        state.users.$set(i, { id: stream.getId(), stream, displaying: false });
        return;
      }
    }
  },

  SET_USER_DISPLAYING (state, userId) {
    for (let i = 0; i < state.users.length; i++) {
      if (state.users[i].id === userId) {
        state.users.$set({ id: userId, displaying: true, stream: state.users[i].stream });
        return;
      }
    }
  },

};

export default new Vuex.Store({
  state: initialState,
  mutations,
});

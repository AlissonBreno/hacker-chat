import ComponentBuilder from "./components.js";
import { constants } from "./constants.js";

export default class TerminalController {
  #usersCollors = new Map();

  constructor() {}

  #pickCollor() {
    return `#${(((1 << 24) * Math.random()) | 0).toString(16)}-fg`;
  }

  #getUserCollor(userName) {
    if (this.#usersCollors.has(userName))
      return this.#usersCollors.get(userName);

    const collor = this.#pickCollor();
    this.#usersCollors.set(userName, collor);

    return collor;
  }

  #onInputReceived(eventEmitter) {
    return function () {
      const message = this.getValue();
      console.log(message);
      this.clearValue();
    };
  }

  #onMessageReceived({ screen, chat }) {
    return (receivedMessage) => {
      const { userName, message } = receivedMessage;

      const collor = this.#getUserCollor(userName);
      chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`);
      screen.render();
    };
  }

  #onLogChanged({ screen, activityLog }) {
    return (changedLog) => {
      const [userName] = changedLog.split(/\s/);
      const collor = this.#getUserCollor(userName);

      activityLog.addItem(`{${collor}}{bold}${changedLog}{/}`);
      screen.render();
    };
  }

  #onStatusChanged({ screen, status }) {
    return (users) => {
      const { content } = status.items.shift();
      status.clearItems();
      status.addItem(content);

      users.forEach((userName) => {
        const collor = this.#getUserCollor(userName);
        status.addItem(`{${collor}}{bold}${userName}{/}`);
      });

      screen.render();
    };
  }

  #registerEvents(eventEmitter, components) {
    eventEmitter.on(
      constants.events.app.MESSAGE_RECEIVED,
      this.#onMessageReceived(components)
    );
    eventEmitter.on(
      constants.events.app.ACTIVITYLOG_UPDATED,
      this.#onLogChanged(components)
    );
    eventEmitter.on(
      constants.events.app.STATUS_UPDATED,
      this.#onStatusChanged(components)
    );
  }

  async initializeTable(eventEmitter) {
    const components = new ComponentBuilder()
      .setScreen({ title: "HackerChat - Alisson Goulart" })
      .setLayoutComponent()
      .setInputComponent(this.#onInputReceived(eventEmitter))
      .setChatComponent()
      .setActivityLogComponent()
      .setStatusComponent()
      .build();

    this.#registerEvents(eventEmitter, components);

    components.input.focus();
    components.screen.render();

    setInterval(() => {
      eventEmitter.emit(constants.events.app.MESSAGE_RECEIVED, {
        message: "Hello World!",
        userName: "AlissonGoulart",
      });

      eventEmitter.emit(
        constants.events.app.ACTIVITYLOG_UPDATED,
        "Alisson left"
      );
      eventEmitter.emit(
        constants.events.app.ACTIVITYLOG_UPDATED,
        "Alisson join"
      );

      const users = ["AlissonGoulart"];
      eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);

      users.push("user1");
      eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);

      users.push("user2");
      eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
    }, 1000);
  }
}

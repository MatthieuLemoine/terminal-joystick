const { TerminalJoystick, ON_DRAG } = require('../lib');

const joystick = new TerminalJoystick({
  title : 'Joystick - Example',
});

joystick.on(ON_DRAG, ({ angle, intensity }) => {
  // Do stuff...
});

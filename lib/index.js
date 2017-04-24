const blessed      = require('blessed');
const Circle       = require('blessed-circle');
const EventEmitter = require('events');

const ON_DRAG     = 'TERMINAL_JOYSTICK::ON_DRAG';
const ON_DRAG_END = 'TERMINAL_JOYSTICK::ON_DRAG_END';

class TerminalJoystick extends EventEmitter {
  constructor(opts) {
    super();
    // Setup screen
    const screen = opts.screen || blessed.screen();
    if (!opts.screen) {
      screen.title = opts.title || 'terminal-joystick';
    }
    // Setup sizes
    const containerDiameter = (opts.container || {}).size || 100;
    const joystickDiameter  = (opts.joystick || {}).size || 20;
    const containerRadius   = containerDiameter / 2;

    // Setup container
    const container = new Circle(Object.assign({},
      {
        top      : 'center',
        left     : 'center',
        diameter : containerDiameter,
        color    : 'white',
      },
      opts.container
    ));
    // Setup joystick
    const joystick = new Circle(Object.assign({},
      {
        parent    : container,
        top       : 'center',
        left      : 'center',
        diameter  : joystickDiameter,
        color     : 'white',
        fill      : true,
        draggable : true,
        shadow    : true,
      },
      opts.joystick
    ));

    let initialX;
    let initialY;
    joystick.on('move', () => {
      const { left, top } = joystick;
      if (!initialX) {
        initialX = left;
      }
      if (!initialY) {
        initialY = top;
      }
      const dx = left - initialX;
      const dy = (2 * top) - (2 * initialY);
      // Maintain in container
      if (dx < -containerRadius || dx > containerRadius ||
        dy < -containerRadius || dy > containerRadius) {
        return;
      }
      const x         = dx / containerRadius;
      const y         = -dy / containerRadius;
      const angle     = getAngle({ x, y });
      // eslint-disable-next-line no-restricted-properties
      let intensity = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      if (intensity > 1) {
        intensity = 1;
      }
      this.emit(ON_DRAG, {
        angle,
        intensity,
        x,
        y,
      });
    });

    joystick.on('mouseup', () => {
      if (!opts.noReturnToOrigin) {
        joystick.left = 'center';
        joystick.top = 'center';
        screen.render();
        this.emit(ON_DRAG, {
          angle     : 0,
          intensity : 0,
          x         : 0,
          y         : 0,
        });
      }
      this.emit(ON_DRAG_END);
    });

    if (!opts.screen) {
      // Append our container to the screen.
      screen.append(container);

      // Close keys
      screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

      // Render
      screen.render();
    }
  }
}

module.exports = {
  TerminalJoystick,
  ON_DRAG,
  ON_DRAG_END,
};

function getAngle({ x, y }) {
  let rad = Math.atan2(y, x);
  if (y <= 0) {
    rad += 2 * Math.PI;
  }
  return (rad * 180) / Math.PI;
}

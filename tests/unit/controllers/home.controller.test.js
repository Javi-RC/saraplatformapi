const homeController = require('../../../src/controllers/home.controller');

describe('Home Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      send: jest.fn()
    };
  });

  describe('home', () => {
    it('debería retornar mensaje de bienvenida', () => {
      homeController.home(req, res);

      expect(res.send).toHaveBeenCalledWith('Welcome to your Express project!');
    });

    it('debería llamarse una sola vez', () => {
      homeController.home(req, res);

      expect(res.send).toHaveBeenCalledTimes(1);
    });
  });
});

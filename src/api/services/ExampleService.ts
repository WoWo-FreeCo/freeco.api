import Logger from '../../utils/logger';

interface IExampleService {
  example();
}

class ExampleService implements IExampleService {
  example() {
    Logger.debug('This is Example Service');
  }
}

export default new ExampleService();

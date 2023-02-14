interface IExampleService {
  logExample();
}

class ExampleService implements IExampleService {
  logExample() {
    console.log('This is Example Service');
  }
}

export default new ExampleService();

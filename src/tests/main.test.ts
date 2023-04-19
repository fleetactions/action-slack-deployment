import * as core from '@actions/core';

import { run } from '../main';
import { ActionClient } from '../client';

jest.mock('@actions/core');
jest.mock('../client', () => ({
  ActionClient: jest.fn(),
}));

describe('run function', () => {
  let sendMessageMock: jest.Mock;

  beforeEach(() => {
    sendMessageMock = jest.fn();
    (ActionClient as jest.Mock).mockImplementation(() => ({
      sendMessage: sendMessageMock,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('calls ActionClient.sendMessage and does not set failure if everything works as expected', async () => {
    await run();

    expect(sendMessageMock).toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  test('calls core.setFailed if an error is thrown', async () => {
    const errorMessage = 'An error occurred';
    (ActionClient as jest.Mock).mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
  });

  test('creates ActionClient with correct input values', async () => {
    const getInputMock = core.getInput as jest.Mock;
    getInputMock.mockReturnValueOnce('success')
      .mockReturnValueOnce('prod')
      .mockReturnValueOnce('blue-green')
      .mockReturnValueOnce('https://example.com/webhook');

    await run();

    expect(ActionClient).toHaveBeenCalledWith({
      workflowStatus: 'success',
      environmentName: 'prod',
      deploymentType: 'blue-green',
      slackWebhookUrl: 'https://example.com/webhook',
    });
  });

  test('creates ActionClient with only required input values', async () => {
    const getInputMock = core.getInput as jest.Mock;
    getInputMock.mockReturnValueOnce('success')
      .mockReturnValueOnce('prod')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('https://example.com/webhook');

    await run();

    expect(ActionClient).toHaveBeenCalledWith({
      workflowStatus: 'success',
      environmentName: 'prod',
      deploymentType: '',
      slackWebhookUrl: 'https://example.com/webhook',
    });
  });

  test('sets failure if invalid workflow status is provided', async () => {
    const getInputMock = core.getInput as jest.Mock;
    getInputMock.mockReturnValueOnce('invalid')
      .mockReturnValueOnce('prod')
      .mockReturnValueOnce('blue-green')
      .mockReturnValueOnce('https://example.com/webhook');

    (ActionClient as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Invalid workflow status (received: 'invalid')");
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Invalid workflow status (received: 'invalid')");
  });
});
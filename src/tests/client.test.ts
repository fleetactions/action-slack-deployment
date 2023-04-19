import { IncomingWebhook } from '@slack/webhook';

import { ActionClient } from '../client';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
    ref: 'refs/heads/test-branch',
    sha: '1234567890abcdef',
    actor: 'test-actor',
  },
}));

describe('ActionClient', () => {
  const mockSlackWebhookUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';

  test('should submit correct payload to Slack webhook', async () => {
    const sendMock = jest.fn();
    IncomingWebhook.prototype.send = sendMock;

    const client = new ActionClient({
      workflowStatus: 'success',
      environmentName: 'staging',
      deploymentType: 'Application',
      slackWebhookUrl: mockSlackWebhookUrl,
    });

    await client.sendMessage();

    const branchUrl = 'https://github.com/test-owner/test-repo/tree/test-branch';
    const commitUrl = 'https://github.com/test-owner/test-repo/commit/1234567890abcdef';
    const userUrl = 'https://github.com/test-actor';

    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];

    expect(payload.text).toBe(`
*STAGING* | *TEST-REPO* | *APPLICATION*
Branch <${branchUrl}|test-branch> (<${commitUrl}|1234567>) | Deployed by <${userUrl}|@test-actor>
    `.trim());

    expect(payload.attachments[0].color).toBe('good');

    expect(payload.attachments[0].fields[0].title).toBe('GitHub Actions');
  });

  test('should submit correct payload to Slack webhook when `deploymentType` is not preset', async () => {
    const sendMock = jest.fn();
    IncomingWebhook.prototype.send = sendMock;

    const client = new ActionClient({
      workflowStatus: 'success',
      environmentName: 'staging',
      slackWebhookUrl: mockSlackWebhookUrl,
    });

    await client.sendMessage();

    const branchUrl = 'https://github.com/test-owner/test-repo/tree/test-branch';
    const commitUrl = 'https://github.com/test-owner/test-repo/commit/1234567890abcdef';
    const userUrl = 'https://github.com/test-actor';

    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];

    expect(payload.text).toBe(`
*STAGING* | *TEST-REPO*
Branch <${branchUrl}|test-branch> (<${commitUrl}|1234567>) | Deployed by <${userUrl}|@test-actor>
    `.trim());

    expect(payload.attachments[0].color).toBe('good');

    expect(payload.attachments[0].fields[0].title).toBe('GitHub Actions');
  });

  test('should submit correct payload to Slack webhook with failure status', async () => {
    const sendMock = jest.fn();
    IncomingWebhook.prototype.send = sendMock;

    const client = new ActionClient({
      workflowStatus: 'failure',
      environmentName: 'staging',
      deploymentType: 'Application',
      slackWebhookUrl: mockSlackWebhookUrl,
    });

    await client.sendMessage();

    const branchUrl = 'https://github.com/test-owner/test-repo/tree/test-branch';
    const commitUrl = 'https://github.com/test-owner/test-repo/commit/1234567890abcdef';
    const userUrl = 'https://github.com/test-actor';

    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];

    expect(payload.text).toBe(`
*STAGING* | *TEST-REPO* | *APPLICATION*
Branch <${branchUrl}|test-branch> (<${commitUrl}|1234567>) | Deployment by <${userUrl}|@test-actor> has *failed*
    `.trim());

    expect(payload.attachments[0].color).toBe('danger');

    expect(payload.attachments[0].fields[0].title).toBe('GitHub Actions');
  });

  test('should submit correct payload to Slack webhook with cancelled status', async () => {
    const sendMock = jest.fn();
    IncomingWebhook.prototype.send = sendMock;

    const client = new ActionClient({
      workflowStatus: 'cancelled',
      environmentName: 'staging',
      deploymentType: 'Application',
      slackWebhookUrl: mockSlackWebhookUrl,
    });

    await client.sendMessage();

    const branchUrl = 'https://github.com/test-owner/test-repo/tree/test-branch';
    const commitUrl = 'https://github.com/test-owner/test-repo/commit/1234567890abcdef';
    const userUrl = 'https://github.com/test-actor';

    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];

    expect(payload.text).toBe(`
*STAGING* | *TEST-REPO* | *APPLICATION*
Branch <${branchUrl}|test-branch> (<${commitUrl}|1234567>) | Deployment by <${userUrl}|@test-actor> was *cancelled*
    `.trim());

    expect(payload.attachments[0].color).toBe('warning');

    expect(payload.attachments[0].fields[0].title).toBe('GitHub Actions');
  });

  test('should throw an error if an invalid workflow status is provided', () => {
    expect(() => {
      new ActionClient({
        workflowStatus: 'invalid',
        environmentName: 'staging',
        deploymentType: 'Application',
        slackWebhookUrl: mockSlackWebhookUrl,
      });
    }).toThrow("Invalid workflow status (received: 'invalid')");
  });
});

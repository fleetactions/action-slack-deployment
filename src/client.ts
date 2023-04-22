import * as github from '@actions/github';
import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook';

enum WorkflowStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  CALCELLED = 'cancelled'
}

interface ActionClientParams {
  workflowStatus: string;
  environmentName: string;
  deploymentType?: string;
  slackWebhookUrl: string;
}

export class ActionClient {
  private workflowStatus: WorkflowStatus;

  private environmentName: string;

  private deploymentType?: string;

  private webhook: IncomingWebhook;

  constructor({ workflowStatus, environmentName, deploymentType, slackWebhookUrl }: ActionClientParams) {
    if (!['success', 'failure', 'cancelled'].includes(workflowStatus)) {
      throw new Error(`Invalid workflow status (received: '${workflowStatus}')`);
    }

    this.workflowStatus = workflowStatus as WorkflowStatus;
    this.environmentName = environmentName;
    this.deploymentType = deploymentType;
    this.webhook = new IncomingWebhook(slackWebhookUrl);
  }

  public async sendMessage(): Promise<void> {
    const payload = {
      text: this.getMessage(this.workflowStatus, this.environmentName, this.deploymentType),
      attachments: [
        {
          color: this.getColor(this.workflowStatus),
          fields: this.getAttachments(),
        },
      ],
    };

    await this.send(payload);
  }

  private getMessage(workflowStatus: string, environmentName: string, deploymentType?: string): string {
    const { owner, repo } = github.context.repo;
    const branch = github.context.ref.replace('refs/heads/', '');
    const { sha } = github.context;
    const { actor } = github.context;

    const branchUrl = `https://github.com/${owner}/${repo}/tree/${branch}`;
    const commitUrl = `https://github.com/${owner}/${repo}/commit/${sha}`;
    const userUrl = `https://github.com/${actor}`;

    const projectInformation = [environmentName, repo, deploymentType]
      .filter(Boolean)
      .map(item => `*${item}*`)
      .join(' | ')
      .toUpperCase();

    const branchInformation = `Branch <${branchUrl}|${branch}> (<${commitUrl}|${sha.substring(0, 7)}>)`;

    let userInformation = '';

    switch (workflowStatus) {
      case WorkflowStatus.SUCCESS:
        userInformation = `Deployed by <${userUrl}|@${actor}>`;
        break;
      case WorkflowStatus.FAILURE:
        userInformation = `Deployment by <${userUrl}|@${actor}> has *failed*`;
        break;
      case WorkflowStatus.CALCELLED:
        userInformation = `Deployment by <${userUrl}|@${actor}> was *cancelled*`;
        break;
    }

    return `
${projectInformation.toUpperCase()}
${branchInformation} | ${userInformation}
    `.trim();
  }

  private getColor = (status: string): string => {
    switch (status) {
      case WorkflowStatus.SUCCESS:
        return 'good';
      case WorkflowStatus.FAILURE:
        return 'danger';
      case WorkflowStatus.CALCELLED:
        return 'warning';
      default:
        return '';
    }
  };

  private getAttachments(): { title: string, value: string }[] {
    const { owner, repo } = github.context.repo;
    const { sha } = github.context;

    return [
      {
        title: 'GitHub Actions',
        value: `<https://github.com/${owner}/${repo}/commit/${sha}/checks|Workflow>`,
      },
    ];
  }

  public async send(payload: IncomingWebhookSendArguments): Promise<void> {
    await this.webhook.send(payload);
  }
}

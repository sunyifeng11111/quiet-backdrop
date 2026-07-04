import { GithubLogo } from '@phosphor-icons/react';

const repositoryUrl = 'https://github.com/sunyifeng11111/quiet-backdrop';

export function GitHubLink() {
  return (
    <a
      className="icon-button github-link"
      href={repositoryUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="在 GitHub 查看 QuietBackdrop"
      title="在 GitHub 查看项目"
    >
      <GithubLogo size={20} weight="fill" />
    </a>
  );
}

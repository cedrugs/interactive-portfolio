#!/bin/bash
set -euo pipefail
source_dir=$(cd "$(dirname "$0")" && pwd)
install -o root -g root -m 755 "$source_dir/portfolio-shell" /usr/local/bin/portfolio-shell
install -o root -g root -m 755 "$source_dir/deploy-portfolio" /usr/local/sbin/deploy-portfolio
if ! id portfolio-deploy >/dev/null 2>&1; then
	useradd --create-home --shell /usr/local/bin/portfolio-shell portfolio-deploy
fi
[[ $(getent passwd portfolio-deploy | cut -d: -f7) == /usr/local/bin/portfolio-shell ]]
install -d -o root -g root -m 755 /opt/docker/sams-valley
chown root:root /home/portfolio-deploy
chmod 755 /home/portfolio-deploy
printf '%s\n' 'portfolio-deploy ALL=(root) NOPASSWD: /usr/local/sbin/deploy-portfolio' > /etc/sudoers.d/sams-valley
chmod 440 /etc/sudoers.d/sams-valley
visudo -cf /etc/sudoers.d/sams-valley

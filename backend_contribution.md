---
name: backend_contribution
description: Process for making changes to the backend repository as a contributor.
---

When making changes to the backend repository (soole-backend) on the user's PC, follow this exact workflow:

1. **Pull Updates**: First, pull all updates from the live GitHub repository to ensure you have the latest code. (`git checkout staging`, `git pull stage`)
2. **Create Branch**: Create a new branch for your specific task or fix. (`git checkout -b <branch-name>`)
3. **Commit and Push**: For every update, commit the changes with a clear message and push the branch to the remote repository. (`git add .`, `git commit -m "..."`, `git push -u origin <branch-name>`)
4. **Create a PR**: Create a Pull Request (PR) (either via a tool like `gh pr create` or by providing the user with the PR creation URL) for the pushed branch so the backend team can view and approve the changes.
5. **Write Test**: Write Test for each feature update you made and always follow the old code base structure and patterns.

**Crucial Reminder:** You are a contributor, not the owner. Never commit or push directly to the main/master branch, and never assume backend changes are instantly live without the backend team's review and deployment. Create one feature per PR that ay it is easy to evaluate

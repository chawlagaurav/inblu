# Project notes for Claude

## Pushing code

When asked to "push code" / "push", push to the **`inblufilters`** remote
(`https://github.com/inblufilters/inblufilters.git`), using the `main` branch:

```
git push inblufilters main
```

Do NOT push to `origin` (`chawlagaurav/inblu`) by default — a bare `git push`
targets `origin` because that is what `main` currently tracks, which is the
wrong repo.

> Credentials: the auth token is already stored in the `inblufilters` remote URL
> in git config. Never paste the token into this file or any committed file —
> that would publish the secret.

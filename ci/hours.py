#!/usr/bin/env python3
"""The hours Kydux is seen working on GitHub, and the dates that keep to them.

    ci/hours.py allowed                exit 0 inside the hours; 1 outside, saying when they open
    ci/hours.py next [--calendar]      when the hours next open: now, inside them; as systemd's
                                       calendar time with --calendar
    ci/hours.py check <base> <head>    exit 0 when every commit after <base> up to <head> is
                                       dated inside the hours, the author's and the committer's
    ci/hours.py redate <base> <head>   the commits after <base> up to <head> made again, dated
                                       inside the hours and ending now; prints the new head

The hours are Madrid's: from 19:00 to 03:00 around a night from Tuesday to
Friday, and the whole of Saturday, Sunday and Monday, so from Friday 19:00
to Tuesday 03:00 without a break. Work outside them stays in local commits;
their dates, the author's and the committer's, are set inside the hours
when they are pushed (ci/push.sh), and the pre-push hook refuses any commit
dated outside them (ci/hooks/pre-push).
"""

import datetime
import os
import subprocess
import sys
import zoneinfo

ZONE = zoneinfo.ZoneInfo("Europe/Madrid")
OPENS = datetime.time(19, 0)
CLOSES = datetime.time(3, 0)
#: The days the hours cover whole: the weekend and Monday.
MONDAY, SATURDAY, SUNDAY = 0, 5, 6
WHOLE_DAYS = (SATURDAY, SUNDAY, MONDAY)


def now() -> datetime.datetime:
    return datetime.datetime.now(ZONE)


def allowed(when: datetime.datetime) -> bool:
    """Whether `when`, in Madrid's time, is inside the hours."""
    when = when.astimezone(ZONE)
    if when.weekday() in WHOLE_DAYS:
        return True
    return when.time() >= OPENS or when.time() < CLOSES


def opens(when: datetime.datetime) -> datetime.datetime:
    """When the hours next open: `when` itself inside them, else 19:00 that day."""
    if allowed(when):
        return when
    return when.replace(hour=OPENS.hour, minute=0, second=0, microsecond=0)


def began(when: datetime.datetime) -> datetime.datetime:
    """When the stretch of hours `when` is in began: the 19:00 that opened
    it, Friday's for the weekend and Monday. For a `when` inside the hours."""
    day = when.date()
    if when.time() < CLOSES or when.weekday() in WHOLE_DAYS:
        day -= datetime.timedelta(days=1)
    while day.weekday() in WHOLE_DAYS:
        day -= datetime.timedelta(days=1)
    return datetime.datetime.combine(day, OPENS, ZONE)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True,
                          check=True).stdout.strip()


def commits(base: str, head: str) -> list[str]:
    """The commits after `base` up to `head`, oldest first; every commit up
    to `head` when `base` is git's null id, as for a branch new on GitHub."""
    if set(base) == {"0"}:
        return git("rev-list", "--topo-order", "--reverse", head).split()
    return git("rev-list", "--topo-order", "--reverse", f"{base}..{head}").split()


def outside(base: str, head: str) -> list[str]:
    """The commits after `base` up to `head` with a date outside the hours."""
    found = []
    for commit in commits(base, head):
        author, committer = git("log", "-1", "--format=%at %ct", commit).split()
        if not all(allowed(datetime.datetime.fromtimestamp(int(stamp), ZONE))
                   for stamp in (author, committer)):
            found.append(commit)
    return found


def redate(base: str, head: str, when: datetime.datetime) -> str:
    """The commits after `base` up to `head`, each made again with the same
    tree, message, author and committer, dated inside the hours: the last
    at `when`, each earlier one a minute before, closer when the hours have
    not been open for that long. The new head; `head` itself with nothing
    to date."""
    todo = commits(base, head)
    if not todo:
        return git("rev-parse", head)
    since = max(1, int((when - began(when)).total_seconds()))
    step = min(60, max(1, since // len(todo)))
    made: dict[str, str] = {}
    for place, commit in enumerate(todo):
        parents = [made.get(old, old) for old in git("log", "-1", "--format=%P", commit).split()]
        tree, name, address = git("log", "-1", "--format=%T%n%an%n%ae", commit).splitlines()
        message = subprocess.run(["git", "log", "-1", "--format=%B", commit],
                                 capture_output=True, text=True, check=True).stdout
        dated = when - datetime.timedelta(seconds=step * (len(todo) - 1 - place))
        stamp = f"@{int(dated.timestamp())} {dated.strftime('%z')}"
        environment = {**os.environ, "GIT_AUTHOR_NAME": name, "GIT_AUTHOR_EMAIL": address,
                       "GIT_AUTHOR_DATE": stamp, "GIT_COMMITTER_NAME": name,
                       "GIT_COMMITTER_EMAIL": address, "GIT_COMMITTER_DATE": stamp}
        with_parents = [item for parent in parents for item in ("-p", parent)]
        made[commit] = subprocess.run(["git", "commit-tree", tree, *with_parents],
                                      input=message, env=environment, capture_output=True,
                                      text=True, check=True).stdout.strip()
    return made[todo[-1]]


def main(args: list[str]) -> int:
    moment = now()
    if args == ["allowed"]:
        if allowed(moment):
            return 0
        print(f"outside the hours Kydux is seen working (19:00 to 03:00 from Tuesday to "
              f"Friday, all of Saturday, Sunday and Monday); they open at "
              f"{opens(moment):%Y-%m-%d %H:%M}", file=sys.stderr)
        return 1
    if args in (["next"], ["next", "--calendar"]):
        print(opens(moment).strftime("%Y-%m-%d %H:%M:%S" if len(args) == 2 else "%c %Z"))
        return 0
    if len(args) == 3 and args[0] == "check":
        found = outside(args[1], args[2])
        for commit in found:
            print(f"dated outside the hours: {git('log', '-1', '--format=%h %ad %s', commit)}",
                  file=sys.stderr)
        return 1 if found else 0
    if len(args) == 3 and args[0] == "redate":
        if not allowed(moment):
            print("the commits are dated at a push, inside the hours", file=sys.stderr)
            return 1
        print(redate(args[1], args[2], moment))
        return 0
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

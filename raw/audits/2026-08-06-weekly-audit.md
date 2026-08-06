# TCA Weekly Audit Report
**Generated:** 2026-08-06T09:52:34.936Z
**Data range:** 2026-05-08 → 2026-08-06

> Rendered from `data/audit-findings.json`. Do not parse this file — downstream
> agents read the JSON. Finding IDs are `sha1(page|issueClass)` and are stable
> week over week, so they can be retracted in `data/retractions.jsonl`.

## Executive Summary

Tallchairadvisor.com has a severe site-wide CTR problem: 236 clicks from 99,415 impressions = 0.24% average CTR, driven almost entirely by /knee-pain-seat-depth/ (40,752 impressions at 0.04% CTR) which alone accounts for 41% of all impressions. Nearly every page ranks in positions 5–10 but fails to convert impressions into clicks, indicating systemic meta-description weakness and some AIO suppression. Secondary issues include title length violations on 5 pages, a meta length violation, a spec inconsistency in the Leap Plus seat-height page, and a cannibalization risk between /chairs/herman-miller-aeron/ and /review/aeron-size-c/. Fixing the top three CTR leaks and the Leap Plus spec error are the highest-leverage actions this week.

## Issues by Severity

_No findings this week._

## Week's Recommended Focus


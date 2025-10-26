"""Backfill script: ensure each group's memberCount matches len(members).

Run from backend/ with Python environment configured for AWS (or DynamoDB local).
"""
from decimal import Decimal
from app.db.connection import groups_table


def fix_member_counts(dry_run=True):
    # scan all groups (be careful with large tables)
    response = groups_table.scan()
    items = response.get("Items", [])

    updated = 0
    for item in items:
        group_id = item.get("groupID")
        members = item.get("members", []) or []
        correct_count = Decimal(len(members))
        current = item.get("memberCount")
        if current != correct_count:
            print(f"Group {group_id}: memberCount {current} -> {correct_count}")
            if not dry_run:
                groups_table.update_item(
                    Key={"groupID": group_id},
                    UpdateExpression="SET memberCount = :count",
                    ExpressionAttributeValues={":count": correct_count}
                )
            updated += 1
    print(f"Checked {len(items)} groups, would update {updated} items{"" if dry_run else ""}.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes instead of dry-run")
    args = parser.parse_args()

    fix_member_counts(dry_run=not args.apply)

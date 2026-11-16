brooms = wizard.find_all("broom")
for broom in brooms:
    right = broom.position.x - wizard.position.x
    up = wizard.position.y - broom.position.y
    wizard.move_right(right)
    wizard.move_up(up)
    if broom.knotted:
        broom.untie()

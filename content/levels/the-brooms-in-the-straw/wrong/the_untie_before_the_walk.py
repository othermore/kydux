brooms = wizard.find_all("broom")
for broom in brooms:
    broom.untie()
    left = wizard.position.x - broom.position.x
    down = broom.position.y - wizard.position.y
    wizard.move_left(left)
    wizard.move_down(down)

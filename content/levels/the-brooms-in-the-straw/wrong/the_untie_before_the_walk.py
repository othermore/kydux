brooms = wizard.find_all("broom")
for broom in brooms:
    left = wizard.position.x - broom.position.x
    down = broom.position.y - wizard.position.y
    broom.untie()
    wizard.move_left(left)
    wizard.move_down(down)

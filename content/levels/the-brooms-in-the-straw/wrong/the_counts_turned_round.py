brooms = wizard.find_all("broom")
for broom in brooms:
    left = broom.position.x - wizard.position.x
    down = broom.position.y - wizard.position.y
    wizard.move_left(left)
    wizard.move_down(down)
    broom.untie()

brooms = wizard.find_all("broom")
for each_broom in brooms:
    left = wizard.position.x - each_broom.position.x
    down = each_broom.position.y - wizard.position.y
    wizard.move_left(left)
    wizard.move_down(down)
    each_broom.untie()

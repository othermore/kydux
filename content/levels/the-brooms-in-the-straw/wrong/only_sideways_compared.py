brooms = wizard.find_all("broom")
for broom in brooms:
    if broom.position.x < wizard.position.x:
        wizard.move_left(wizard.position.x - broom.position.x)
    else:
        wizard.move_right(broom.position.x - wizard.position.x)
    wizard.move_down(broom.position.y - wizard.position.y)
    broom.untie()

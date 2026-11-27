brooms = wizard.find_all("broom")
for each_broom in brooms:
    if each_broom.position.x < wizard.position.x:
        wizard.move_left(wizard.position.x - each_broom.position.x)
    else:
        wizard.move_right(each_broom.position.x - wizard.position.x)
    wizard.move_down(each_broom.position.y - wizard.position.y)
    each_broom.untie()

broom = wizard.find_nearest("broom")
if broom.position.x > wizard.position.x:
    wizard.move_left(wizard.position.x - broom.position.x)
else:
    wizard.move_right(broom.position.x - wizard.position.x)
if broom.position.y < wizard.position.y:
    wizard.move_up(wizard.position.y - broom.position.y)
else:
    wizard.move_down(broom.position.y - wizard.position.y)
broom.untie()

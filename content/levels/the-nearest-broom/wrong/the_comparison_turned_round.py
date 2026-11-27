my_broom = wizard.find_nearest("broom")
if my_broom.position.x > wizard.position.x:
    wizard.move_left(wizard.position.x - my_broom.position.x)
else:
    wizard.move_right(my_broom.position.x - wizard.position.x)
if my_broom.position.y < wizard.position.y:
    wizard.move_up(wizard.position.y - my_broom.position.y)
else:
    wizard.move_down(my_broom.position.y - wizard.position.y)
my_broom.untie()

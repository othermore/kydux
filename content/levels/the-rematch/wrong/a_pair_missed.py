def two_rings(first, second):
    wizard.move_up(2)
    wizard.move_right(first)
    wizard.move_down(2)
    wizard.move_right(second)

wizard.cast("drevo")
wizard.move_right(2)
two_rings(2, 3)
two_rings(2, 3)
wizard.move_right(5)
two_rings(2, 2)

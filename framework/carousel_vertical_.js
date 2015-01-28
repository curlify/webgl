
var carousel_vertical = function(ident,width,height) {

  var container = new focusable(ident,width,height)

  var move_in = { name="move in", show:[], hide:[] }
  move_in.show.push( {target:'position.y',startposition:screenHeight,endposition:0,func:animator.outQuad} )
  move_in.show.push( {target:'alpha',startposition:0,endposition:1,func:animator.outExpo} )
  move_in.hide.push( {target:'position.y',startposition:0,endposition:0,func:animator.linear} )
  move_in.hide.push( {target:'alpha',startposition:1,endposition:0,func:animator.inExpo} )

  container.contentsize = {width:container.size.width,height:container.size.height}
  container.inertia = 5
  container.swipespeed = screenWidth
  container.movespeed = 1.0
  container.movethreshold = 40
  container.itemsize = screenHeight
  container.transition = move_in
  container.unload_distance = 1.0
  container.wrap = false
  container.alwaysmove = false
  container.nevermove = false

  container.swipefunc = animator.outQuad

  var instance = container.add( object.new("carousel vertical") )
  instance.targetposition = {x:0,y:0,z:0}
  container.instance = instance

  var itemcontainer = container.add( object.new("item container") )
  itemcontainer.itemaddposition = 0
  container.itemcontainer = itemcontainer

  container.setTransition = function(self,trans) {
    var i=1
    for i=1,#itemcontainer.children do
      itemcontainer.children[i]:reset()
    end
    container.transition = trans    
    itemcontainer.reverseDrawOrder = false
    if trans.reverse_draw then
      itemcontainer.reverseDrawOrder = true
    end
  }

  var move = function(source,target,timedelta) {
    if (timedelta > 100) timedelta = 100
    var dir = 1
    if (source > target) dir = -1
    var move = (-dir*timedelta / (container.inertia*16.66)) * Math.abs(source-target)
    if (Math.abs(move) < 0.03) { source = target } else { source = source-move }
    if (dir == 1 && source > target) source = target
    if (dir == -1 && source < target) source = target
    return source
  }

  instance.setMoving = function() {
    if (getpointerStealer() == null && container.nevermove != true) {
      stealPointers( container )
      if (container.stolePointers != null) container.stolePointers()
      instance.moving = true
    }
  }

  container.focus = function(self,x,y) {
    print("focus vertical carousel",container.identifier)
    if instance.moving then 
      instance.moving = false
      //scene:stealPointers(container)
      instance.targetposition.x,instance.targetposition.y=instance.position.x,instance.position.y
    end
    instance.pressOffset = {x:instance.targetposition.x-x*container.movespeed,y:instance.targetposition.y-y*container.movespeed}
    container.pressStarted = {x:x,y:y}
    //if instance.moving then instance:resetpress() end
  }

  container.focusdrag = function(self,x,y)
    var newx,newy = instance.pressOffset.x+x*container.movespeed, instance.pressOffset.y+y*container.movespeed
    var diffx,diffy=newx-instance.targetposition.x,newy-instance.targetposition.y
    //var difflen = math.sqrt(diffx^2 + diffy^2)

    //if (container.alwaysmove or container.contentsize.width != container.size.width) and math.abs(diffx) > container.movethreshold then instance.setMoving() end
    if (container.alwaysmove or container.contentsize.height != container.size.height) and math.abs(diffy) > container.movethreshold then instance.setMoving() end

    if instance.moving then
      instance.targetposition.x,instance.targetposition.y = newx,newy
    end
  end

  container.defocus = function(self,x,y)
    var selitem = math.floor((-instance.targetposition.y+container.itemsize/2)/container.itemsize)
    instance.targetposition.y = -selitem*container.itemsize
    if container.carouselmoved != null then container.carouselmoved(selitem) end
  end

  container.step = function(self,timedelta)

    var xlimit = -container.contentsize.width+container.itemsize
    var ylimit = -container.contentsize.height+container.itemsize

    if container.wrap == false then
      if instance.targetposition.x > container.itemsize/4 then instance.targetposition.x = container.itemsize/4 end
      if instance.targetposition.y > container.itemsize/4 then instance.targetposition.y = container.itemsize/4 end
      if instance.targetposition.x < xlimit-container.itemsize/4 then instance.targetposition.x = xlimit-container.itemsize/4 end
      if instance.targetposition.y < ylimit-container.itemsize/4 then instance.targetposition.y = ylimit-container.itemsize/4 end

      if container.focused == false then
        if instance.targetposition.x > 0 then instance.targetposition.x = move(instance.targetposition.x,0,timedelta/2) end
        if instance.targetposition.y > 0 then instance.targetposition.y = move(instance.targetposition.y,0,timedelta/2) end
        if instance.targetposition.x < xlimit then instance.targetposition.x = move(instance.targetposition.x,xlimit,timedelta/2) end
        if instance.targetposition.y < ylimit then instance.targetposition.y = move(instance.targetposition.y,ylimit,timedelta/2) end
      end
    else
      if instance.targetposition.x > container.size.width then
        print("switch",instance.position.x,instance.targetposition.x,container.contentsize.width)
        instance.targetposition.x = instance.targetposition.x - container.contentsize.width
        instance.position.x = instance.position.x - container.contentsize.width
        instance.pressOffset.x = instance.pressOffset.x - container.contentsize.width
      elseif instance.targetposition.x < xlimit-container.size.width then
        print("+++switch2",instance.position.x,instance.targetposition.x)
        instance.targetposition.x = instance.targetposition.x + container.contentsize.width
        instance.position.x = instance.position.x + container.contentsize.width
        instance.pressOffset.x = instance.pressOffset.x + container.contentsize.width
      end
    end

    var td = timedelta

    if td > 100 then td = 1 end

    if container.focused == false then td = timedelta/2 end
    if container.alwaysmove or container.contentsize.width != container.size.width then instance.position.x = move(instance.position.x,instance.targetposition.x,td) end
    if container.alwaysmove or container.contentsize.height != container.size.height then instance.position.y = move(instance.position.y,instance.targetposition.y,td) end

    if container.focused == false and instance.position.x == instance.targetposition.x and instance.position.y == instance.targetposition.y then instance.moving = false end
    //print("//",instance.position.x,instance.targetposition.x,container.contentsize.width)

    if instance.moving then
      sys.requestRepaint()
      //print("repaint:",instance.position.x,instance.targetposition.x,instance.position.y,instance.targetposition.y)
    end
  end

  /*
  container.swipeDown = function(self,speed)
    print("swipeDown",speed,container.focused,container.swipefunc(0,container.swipespeed,speed))
    if container.focused then instance.targetposition.y = instance.targetposition.y-container.swipefunc(0,container.swipespeed,speed) end
  end

  container.swipeUp = function(self,speed)
    print("swipeUp",speed,container.focused,container.swipefunc(0,container.swipespeed,speed))
    if container.focused then instance.targetposition.y = instance.targetposition.y+container.swipefunc(0,container.swipespeed,speed) end
  end
  */

  container.prepare = function()
    for i=1,#itemcontainer.children do
      itemcontainer.children[i]:step(0)
    end
  end

  container.moveto = function(item,instant)
    instance.targetposition.y = -item*container.itemsize
    if instant then
      instance.position.y = instance.targetposition.y
    end
    if container.carouselmoved != null then container.carouselmoved(item) end
  end

  container.selected = function()
    return math.floor((-instance.targetposition.y+container.itemsize/2)/container.itemsize)
  end


  // add children to itemcontainer, not container
  container.add = function(self,child,indx)
    var index = indx
    if index == null then index = #itemcontainer.children+1 end
    child.parent = itemcontainer
    table.insert( itemcontainer.children, index, child )

    var camera = self:getCamera()
    if camera != null then
      child:updateCamera( camera )
    end

    child.itemposition = itemcontainer.itemaddposition
    child.visible = false

    child.reset = function(self)
      self.position.x,self.position.y,self.position.z=0,0,0
      self.scale.x,self.scale.y=1,1
      self.rotate.x,self.rotate.y,self.rotate.z=0,0,0
      self.alpha=1
      //self.visible=true
    end

    child.step = function(self,timedelta)
      var dist = (instance.position.y+self.itemposition) / screenHeight

      if container.wrap then
        if dist > (#itemcontainer.children-1) then dist = dist - #itemcontainer.children/2 end
        if dist < -#itemcontainer.children+1 then dist = dist + #itemcontainer.children/2 end
      end

      if (dist <= -container.unload_distance or dist >= container.unload_distance) then
        if self.unload_content != null and self.content != null then self:unload_content() end
      else
        if self.load_content != null and self.content == null then
          self:load_content()
        end
      end

      self.active = true
      if math.abs(dist) > 0.2 then self.active = false end

      self.visible = true
      if math.abs(dist) > 1 then self.visible = false end

      if self.distance == dist or math.abs(dist) > 2 then return end
      self.distance = dist

      var trans = container.transition
      if dist >= 0 then
        for i=1,#trans.show do
          var show = trans.show[i]
          if show.target == 'position.x' then self.position.x = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'position.y' then self.position.y = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'position.z' then self.position.z = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'scale.x' then self.scale.x = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'scale.y' then self.scale.y = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'rotate.x' then self.rotate.x = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'rotate.y' then self.rotate.y = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'rotate.z' then self.rotate.z = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'alpha' then self.alpha = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          elseif show.target == 'transition_value' then self.transition_value = show.func( show.startposition, show.endposition, math.abs(1.0-dist) )
          end
        end
      else
        for i=1,#trans.hide do
          var hide = trans.hide[i]
          if hide.target == 'position.x' then self.position.x = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'position.y' then self.position.y = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'position.z' then self.position.z = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'scale.x' then self.scale.x = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'scale.y' then self.scale.y = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'rotate.x' then self.rotate.x = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'rotate.y' then self.rotate.y = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'rotate.z' then self.rotate.z = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'alpha' then self.alpha = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          elseif hide.target == 'transition_value' then self.transition_value = hide.func( hide.startposition, hide.endposition, math.abs(dist) )
          end
        end
      end

    end

    itemcontainer.itemaddposition = itemcontainer.itemaddposition + container.itemsize
    container.contentsize.height = container.itemsize * #itemcontainer.children

    //print("add child",child.identifier,child.itemposition)

    return child
  end


  return container
end


carousel_vertical.new = function(ident,width,height) {
  return new carousel_vertical(ident,width,height)
}

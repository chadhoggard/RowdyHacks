"""
Invite routes for group invitations
Endpoints for creating, accepting, declining, and managing invites
"""
from fastapi import APIRouter, HTTPException, Depends
from ..models import InviteCreate, InviteResponse
from ..db import invites, groups, users
from ..auth import verify_token

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("", response_model=InviteResponse)
async def create_invite(invite_data: InviteCreate, current_user: dict = Depends(verify_token)):
    """
    Create a new group invite
    Only group owners can send invites
    """
    user_id = current_user["sub"]
    
    # Verify user is group owner
    if not groups.is_owner(invite_data.groupId, user_id):
        raise HTTPException(status_code=403, detail="Only group owners can send invites")
    
    # Create invite directly (skip checks for now)
    invite = invites.create_invite(
        group_id=invite_data.groupId,
        inviter_id=user_id,
        invitee_email=invite_data.inviteeEmail
    )
    
    if not invite:
        raise HTTPException(status_code=500, detail="Failed to create invite")
    
    return InviteResponse(**invite)


@router.get("", response_model=list[InviteResponse])
async def get_my_invites(current_user: dict = Depends(verify_token)):
    """
    Get all pending invites for current user's email
    """
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email not found")
    
    user_invites = invites.get_user_invites(user_email)
    return [InviteResponse(**inv) for inv in user_invites]


@router.get("/group/{group_id}", response_model=list[InviteResponse])
async def get_group_invites(group_id: str, current_user: dict = Depends(verify_token)):
    """
    Get all invites for a specific group
    Only group owners can view group invites
    """
    user_id = current_user["sub"]
    
    # Verify user is group owner
    if not groups.is_owner(group_id, user_id):
        raise HTTPException(status_code=403, detail="Only group owners can view group invites")
    
    group_invites = invites.get_group_invites(group_id)
    return [InviteResponse(**inv) for inv in group_invites]


@router.post("/{invite_id}/accept")
async def accept_invite(invite_id: str, current_user: dict = Depends(verify_token)):
    """
    Accept a group invite
    Adds user to the group and updates invite status
    """
    user_id = current_user["sub"]
    user_email = current_user.get("email")
    
    # Get the invite
    invite = invites.get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Verify invite is for this user
    if invite["inviteeEmail"] != user_email:
        raise HTTPException(status_code=403, detail="This invite is not for you")
    
    # Check if already accepted or declined
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invite already {invite['status']}")
    
    # Add user to group members list
    success = groups.add_member(invite["groupID"], user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add member to group")
    
    # Add group to user's groups list
    users.add_group_to_user(user_id, invite["groupID"])
    
    # Update invite status
    invites.update_invite_status(invite_id, "accepted")
    
    return {
        "message": "Invite accepted successfully",
        "groupId": invite["groupID"]
    }


@router.post("/{invite_id}/decline")
async def decline_invite(invite_id: str, current_user: dict = Depends(verify_token)):
    """
    Decline a group invite
    Updates invite status to declined
    """
    user_email = current_user.get("email")
    
    # Get the invite
    invite = invites.get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Verify invite is for this user
    if invite["inviteeEmail"] != user_email:
        raise HTTPException(status_code=403, detail="This invite is not for you")
    
    # Check if already accepted or declined
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invite already {invite['status']}")
    
    # Update invite status
    invites.update_invite_status(invite_id, "declined")
    
    return {"message": "Invite declined"}


@router.delete("/{invite_id}")
async def cancel_invite(invite_id: str, current_user: dict = Depends(verify_token)):
    """
    Cancel/delete a pending invite
    Only group owners can cancel invites
    """
    user_id = current_user["sub"]
    
    # Get the invite
    invite = invites.get_invite(invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Verify user is the inviter or group owner
    if invite["inviterID"] != user_id and not groups.is_owner(invite["groupID"], user_id):
        raise HTTPException(status_code=403, detail="Only the inviter or group owner can cancel invites")
    
    # Delete the invite
    success = invites.delete_invite(invite_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete invite")
    
    return {"message": "Invite cancelled successfully"}

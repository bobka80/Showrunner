'-----------------------------------------------------------------------
' <copyright file="DisplayResponder.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text
Imports System.Threading
Imports TechnologySolutions.Rfid.AsciiProtocol

''' <summary>
''' Implements the <see cref="IAsciiCommandResponder"/> to output all received lines to the UI
''' </summary>
Public Class DisplayResponder
    Implements IAsciiCommandResponder
    Implements IDisposable
    ''' <summary>
    ''' True when an instance of this class is disposed
    ''' </summary>
    Private disposed As Boolean

    ''' <summary>
    ''' Signalled when there are messages in the queue
    ''' </summary>
    Private waitMessage As AutoResetEvent

    ''' <summary>
    ''' Thread used to post queued messages to the user interface
    ''' </summary>
    Private messageThread As Thread

    ''' <summary>
    ''' The queue of messages to send to the user interface
    ''' </summary>
    Private lines As Queue(Of AsciiLineEventArgs)

    ''' <summary>
    ''' Initializes a new instance of the DisplayResponder class
    ''' </summary>
    Public Sub New()
        Me.lines = New Queue(Of AsciiLineEventArgs)()
        Me.waitMessage = New AutoResetEvent(False)
        Me.messageThread = New Thread(AddressOf Me.RunLoop)
        Me.messageThread.Name = "DisplayResponderPostMessage"
        Me.messageThread.Start()
    End Sub

    ''' <summary>
    ''' Raised for each line received
    ''' </summary>
    Public Event ReceivedLine As EventHandler(Of AsciiLineEventArgs)

    ''' <summary>
    ''' Handles the line by raising the ReceivedLine event. Does not mark as handled
    ''' </summary>
    ''' <param name="line">The received line</param>
    ''' <param name="moreLinesAvailable">True if more lines are already buffered to process</param>
    ''' <returns>True if no further responders should process this message</returns>
    Public Function ProcessReceivedLine(ByVal line As IAsciiResponseLine, ByVal moreLinesAvailable As Boolean) As Boolean Implements IAsciiCommandResponder.ProcessReceivedLine
        If Not Me.disposed Then
            Me.lines.Enqueue(New AsciiLineEventArgs(line, moreLinesAvailable))
            Me.waitMessage.[Set]()
        End If

        Return False
    End Function

    ''' <summary>
    ''' Disposes an instance of the DisplayResponder class
    ''' </summary>
    Public Sub Dispose() Implements IDisposable.Dispose
        Me.Dispose(True)
        GC.SuppressFinalize(Me)
    End Sub

    ''' <summary>
    ''' Disposes an instance of the DisplayResponder class
    ''' </summary>
    ''' <param name="disposing">True to dispose managed as well as unmanaged resources</param>
    Protected Overridable Sub Dispose(ByVal disposing As Boolean)
        If Not Me.disposed Then
            If disposing Then
                Me.disposed = True
                Me.waitMessage.[Set]()
            End If

            Me.disposed = True
        End If
    End Sub

    ''' <summary>
    ''' Raises the <see cref="ReceivedLine"/> event
    ''' </summary>
    ''' <param name="e">The argumments for the event</param>
    Protected Overridable Sub OnReceivedLine(ByVal e As AsciiLineEventArgs)
        RaiseEvent ReceivedLine(Me, e)
    End Sub

    ''' <summary>
    ''' Calls OnReceivedLine with state cast as AsciiLineEventArgs
    ''' </summary>
    ''' <param name="state">An AsciiLineEventArgs instance to use for the ReceievedLine event</param>
    Private Sub NotifyLine(ByVal state As Object)
        Dim e As AsciiLineEventArgs

        e = TryCast(state, AsciiLineEventArgs)
        If e IsNot Nothing Then
            Me.OnReceivedLine(e)
        End If
    End Sub

    ''' <summary>
    ''' Thread that posts messages to the user interface. Thread is signalled as messages are queued to the dislpay.
    ''' Runs until the queue is emptied and then waits again
    ''' </summary>
    Private Sub RunLoop()
        While Not Me.disposed
            Me.waitMessage.WaitOne()

            While Not Me.disposed AndAlso Me.lines.Count > 0
                Me.OnReceivedLine(Me.lines.Dequeue())
            End While
        End While
    End Sub
End Class

